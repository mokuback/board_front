// board/src/utils/imageUpload.ts
export const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        )
        const data = await response.json()
        return data.secure_url
    } catch (error) {
        console.error('Upload failed:', error)
        throw new Error('图片上传失败')
    }
}
