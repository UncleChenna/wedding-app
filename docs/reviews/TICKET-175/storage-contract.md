# Invitation photo storage and access

`POST /api/admin/photos` accepts a raw JPEG, PNG or WebP body from the same origin.
Complete two-step admin sign-in is required before reading the body. JSON, remote
URLs and multipart forms are not accepted. Both declared and streamed sizes are
bounded at 8 MiB. The decoder accepts one still frame, at most 24 megapixels and
8192 pixels on either axis. Metadata is stripped, EXIF orientation applied, and
pixels re-encoded to WebP at most 2560 pixels on either axis and 4 MiB total.
The blur image is at most 24 pixels per axis and 8 KiB.

Successful responses contain only `{ id, mime, width, height, blurDataURL }`.
The ID is an application-generated UUID, not a path or external URL. The original
filename, original bytes and metadata are never persisted. All responses are private
and no-store. The decoder rejects incomplete/trailing containers and animations;
canonical re-encoding additionally removes embedded ancillary payloads. It does not
claim to detect every imaginable polyglot.

`GET /api/admin/photos/<id>` independently checks admin identity and two-step sign-in,
validates the UUID, and returns only WebP with nosniff and private/no-store headers.
Unpublished images are not available to guests. TICKET-099/178 must explicitly connect
a selected controlled asset to the editor/published invitation; knowing an ID alone
does not make a private photo public. There is no automatic remote image fetch.

The sixteen-slot gallery rejects uploads when full. It never overwrites or silently
deletes an existing photo. Upload and slot allocation commit atomically, so a failed
transaction leaves no separately stored object to clean up. A response lost after a
successful commit can leave an unused slot; retries are not deduplicated. Operators
must review unused assets before any separately authorized cleanup.

Retention: retain selected photos through the event and the existing 90-day post-event
retention period, then include them in the authorized data-retention procedure.
This ticket does not add automatic deletion. Unselected photos also remain until
authorized cleanup. Database backups contain photos and uploader UUIDs and must use
the same access restrictions and backup-expiry policy; deleting a live row does not
erase backups. Restore rehearsals must include these rows. Never expose backup files
or database credentials to the browser.
