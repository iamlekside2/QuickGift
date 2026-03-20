import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings


def _configure_cloudinary():
    """Configure Cloudinary SDK with settings from environment."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image(file: UploadFile, folder: str = "quickgift") -> str:
    """Upload an image to Cloudinary and return the secure URL."""
    _configure_cloudinary()
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        resource_type="image",
    )
    return result["secure_url"]
