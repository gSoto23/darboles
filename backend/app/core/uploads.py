import os
import uuid
from fastapi import HTTPException, UploadFile

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def save_image(file: UploadFile, subdir: str) -> str:
    """Guarda una imagen validada en uploads/<subdir> y devuelve su URL pública.

    La extensión sale del content-type validado, nunca del nombre que manda el cliente,
    para que no se pueda subir un .html o .svg y servirlo desde nuestro dominio.
    """
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPEG, PNG o WebP")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    upload_dir = os.path.join(os.getcwd(), "uploads", subdir)
    os.makedirs(upload_dir, exist_ok=True)
    new_filename = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(upload_dir, new_filename), "wb") as buffer:
        buffer.write(contents)

    return f"/api/uploads/{subdir}/{new_filename}"
