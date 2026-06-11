export async function uploadToS3(file: File, presignedUrl: string) {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  return res.ok;
}
