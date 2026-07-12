<?php
header('Content-Type: application/json;');
ini_set('serialize_precision', 14);
require_once __DIR__ . '/../config/db-connection.php';

// Fetch all room images
$img_query = "SELECT room_id, image_url, is_primary FROM ROOM_IMAGES ORDER BY room_id, is_primary DESC, id ASC";
$img_res = mysqli_query($conn, $img_query);
$images_by_room = [];
$primary_image_by_room = [];

if ($img_res) {
  while ($img = mysqli_fetch_assoc($img_res)) {
    $r_id = $img['room_id'];
    if (!isset($images_by_room[$r_id])) {
      $images_by_room[$r_id] = [];
    }
    $images_by_room[$r_id][] = $img['image_url'];
    if ((int)$img['is_primary'] === 1 || !isset($primary_image_by_room[$r_id])) {
      $primary_image_by_room[$r_id] = $img['image_url'];
    }
  }
}

// Fetch all room amenities
$am_query = "SELECT ra.room_id, a.name FROM ROOM_AMENITIES ra JOIN AMENITIES a ON ra.amenity_id = a.id";
$am_res = mysqli_query($conn, $am_query);
$amenities_by_room = [];

if ($am_res) {
  while ($am = mysqli_fetch_assoc($am_res)) {
    $r_id = $am['room_id'];
    if (!isset($amenities_by_room[$r_id])) {
      $amenities_by_room[$r_id] = [];
    }
    $amenities_by_room[$r_id][] = $am['name'];
  }
}

$check_in = isset($_GET['checkin']) ? mysqli_real_escape_string($conn, $_GET['checkin']) : null;
$check_out = isset($_GET['checkout']) ? mysqli_real_escape_string($conn, $_GET['checkout']) : null;

// Fetch all active rooms
$query = "SELECT 
            r.id,
            r.name,
            rt.name AS type,
            r.floor,
            vt.name AS view,
            r.price,
            r.rating,
            r.review_count AS reviewCount,
            r.max_guests AS maxGuests,
            r.bed_count AS beds,
            bt.name AS bedType,
            r.size,
            r.description,
            r.is_active
          FROM ROOMS r
          LEFT JOIN ROOM_TYPES rt ON r.room_types_id = rt.id
          LEFT JOIN VIEW_TYPES vt ON r.view_type_id = vt.id
          LEFT JOIN BED_TYPES bt ON r.bed_type_id = bt.id
          WHERE r.is_active = TRUE";

if ($check_in && $check_out) {
  $query .= " AND r.id NOT IN (
                SELECT b.room_id FROM BOOKINGS b
                WHERE b.status != 'Cancelled'
                  AND b.check_in < '$check_out'
                  AND b.check_out > '$check_in'
              )";
}

$res = mysqli_query($conn, $query);
$rooms = [];

if ($res) {
  while ($row = mysqli_fetch_assoc($res)) {
    $r_id = $row['id'];
    $rooms[] = [
      'id' => $r_id,
      'name' => $row['name'],
      'type' => $row['type'],
      'floor' => (int)$row['floor'],
      'view' => $row['view'],
      'price' => (float)$row['price'],
      'rating' => round((float)$row['rating'], 1),
      'reviewCount' => (int)$row['reviewCount'],
      'maxGuests' => (int)$row['maxGuests'],
      'beds' => (int)$row['beds'],
      'bedType' => $row['bedType'],
      'size' => (int)$row['size'],
      'image' => isset($primary_image_by_room[$r_id]) ? $primary_image_by_room[$r_id] : '',
      'images' => isset($images_by_room[$r_id]) ? $images_by_room[$r_id] : [],
      'description' => $row['description'],
      'amenities' => isset($amenities_by_room[$r_id]) ? $amenities_by_room[$r_id] : [],
      'featured' => in_array($r_id, ['room-001', 'room-004', 'room-007', 'room-009', 'room-010', 'room-013', 'room-016', 'room-017', 'room-019', 'room-022'])
    ];
  }
}

echo json_encode($rooms, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
