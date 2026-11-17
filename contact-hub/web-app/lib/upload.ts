export function uploadFile<T = unknown>(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;
    xhr.ontimeout = () => reject(new Error("Upload timed out. It may have been accepted; check with your administrator before resubmitting."));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error("The server returned an unexpected response."));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error. Check your connection."));

    const body = new FormData();
    body.append("file", file); // field name must match what your API expects
    xhr.send(body);
  });
}