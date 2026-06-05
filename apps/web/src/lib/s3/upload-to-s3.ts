export async function uploadToS3(file: File, presignedUrl: string) {
  console.log('Uploading to S3', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    presignedUrl,
  });

  try {
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    const text = await res.text();

    console.log('S3 upload response', {
      status: res.status,
      ok: res.ok,
      body: text,
    });

    return res.ok;
  } catch (error) {
    console.error('S3 upload fetch failed before receiving response', error);
    return false;
  }
}
