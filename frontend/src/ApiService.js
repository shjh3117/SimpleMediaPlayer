export async function requestSubtitle(videoId, caption) {
  try {
    const response = await fetch('/api/request-subtitle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        caption,
      })
    });

    if (!response.ok) {
      throw new Error('서버 응답 오류: ${response.status}');
    }

    return await response.blob();
  } catch (error) {
    console.error('자막요청 중 오류 발생:', error);
    throw error;
  }
}