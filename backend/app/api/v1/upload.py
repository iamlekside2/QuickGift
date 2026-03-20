from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.security import get_current_user
from app.core.upload import upload_image

router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/image")
async def upload_image_endpoint(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload an image file and return its Cloudinary URL."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: jpg, png, webp.",
        )

    # Validate file size (read and check length)
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5 MB.",
        )

    # Reset file position so upload_image can read it again
    await file.seek(0)

    try:
        url = await upload_image(file, folder="quickgift")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    return {"url": url}
