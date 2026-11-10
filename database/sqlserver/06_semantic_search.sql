/* ============================================================
   Ocean Haven Hotel — AI semantic search (SQL Server 2025 VECTOR)

   Goal: guests describe what they want in their own words, in English or
   Vietnamese ("quiet room for a couple with a bathtub", "phòng gia đình
   nhìn ra biển có bếp"), and get the rooms whose MEANING is closest,
   even when no keyword matches.

   How it works:
     1. sp_GetRoomsMissingEmbedding builds one descriptive text per room
        (name, type, view, beds, capacity, amenities, description).
     2. The app sends that text to the local embedding model (Ollama,
        bge-m3, multilingual, 1024 dimensions) and stores the vector with
        sp_UpsertRoomEmbedding into room_embeddings.embedding VECTOR(1024).
     3. At search time the app embeds the guest's query with the same model
        and calls sp_SemanticSearchRooms, which ranks rooms by
        VECTOR_DISTANCE('cosine', room_vector, query_vector)
        and applies normal relational filters (active, available, capacity).

   Freshness: triggers in 04_triggers.sql delete a room's vector when its text
   or amenities change; step 1 picks it up again on the next search.

   Why no VECTOR INDEX: with 22 rooms an exact scan compares 22 vectors,
   which takes well under a millisecond and returns the exact nearest
   neighbours. An approximate DiskANN index (CREATE VECTOR INDEX + VECTOR_SEARCH)
   only pays off with tens of thousands of rows; see README.md.
   ============================================================ */
USE OceanHaven;
GO

/* ------------------------------------------------------------
   sp_GetRoomsMissingEmbedding: text to embed for every active room
   that has no vector yet (new room, or invalidated by a trigger).
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_GetRoomsMissingEmbedding
AS
BEGIN
    SET NOCOUNT ON;

    SELECT r.id AS room_id,
           CONCAT(r.name, N'. ',
                  rt.name, N' room with ', vt.name, N' on floor ', r.floor, N'. ',
                  N'Sleeps up to ', r.max_guests, N' guests in ', r.bed_count, N' ', bt.name, N' bed(s). ',
                  N'Size ', r.size, N' m2. ',
                  N'Amenities: ', am.list, N'. ',
                  r.description) AS content
    FROM dbo.rooms AS r
    LEFT JOIN dbo.room_types AS rt ON rt.id = r.room_type_id
    LEFT JOIN dbo.view_types AS vt ON vt.id = r.view_type_id
    LEFT JOIN dbo.bed_types  AS bt ON bt.id = r.bed_type_id
    OUTER APPLY (
        SELECT STRING_AGG(a.name, N', ') WITHIN GROUP (ORDER BY a.name) AS list
        FROM dbo.room_amenities AS ra
        JOIN dbo.amenities AS a ON a.id = ra.amenity_id
        WHERE ra.room_id = r.id
    ) AS am
    WHERE r.is_active = 1
      AND NOT EXISTS (SELECT 1 FROM dbo.room_embeddings AS e WHERE e.room_id = r.id);
END;
GO

/* ------------------------------------------------------------
   sp_UpsertRoomEmbedding: store (or replace) one room's vector.
   @Embedding is a JSON array string "[0.12, -0.03, ...]"; CAST turns it
   into the native VECTOR type (validated: must have exactly 1024 numbers).
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_UpsertRoomEmbedding
    @RoomId    VARCHAR(50),
    @Embedding NVARCHAR(MAX),
    @Model     VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.room_embeddings WHERE room_id = @RoomId;

        INSERT INTO dbo.room_embeddings (room_id, embedding, model)
        VALUES (@RoomId, CAST(@Embedding AS VECTOR(1024)), @Model);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* ------------------------------------------------------------
   sp_SemanticSearchRooms: k-nearest-neighbour search + relational filters.
     similarity = 1 - cosine distance  (1 = same meaning, 0 = unrelated)
   @MinSimilarity drops rooms that are only weakly related to the query,
   so a nonsense query returns nothing instead of "the least bad" rooms.
   ------------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_SemanticSearchRooms
    @QueryEmbedding NVARCHAR(MAX),
    @Top            INT   = 6,
    @MinSimilarity  FLOAT = 0.45,
    @CheckIn        DATE  = NULL,
    @CheckOut       DATE  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Query VECTOR(1024) = CAST(@QueryEmbedding AS VECTOR(1024));

    SELECT TOP (@Top)
           r.id AS room_id,
           CAST(1 - d.distance AS FLOAT) AS similarity
    FROM dbo.room_embeddings AS e
    JOIN dbo.rooms AS r ON r.id = e.room_id
    CROSS APPLY (SELECT VECTOR_DISTANCE('cosine', e.embedding, @Query) AS distance) AS d
    WHERE r.is_active = 1
      AND 1 - d.distance >= @MinSimilarity
      AND (@CheckIn IS NULL OR @CheckOut IS NULL
           OR NOT EXISTS (SELECT 1
                          FROM dbo.fn_BlockingBookings(@CheckIn, @CheckOut) AS bb
                          WHERE bb.room_id = r.id))
    ORDER BY d.distance;
END;
GO
