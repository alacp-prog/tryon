import { File, Paths } from 'expo-file-system';

/**
 * Returns a `file://` URI for any image source (file, http(s) or data URI),
 * copying it to the cache when needed. Native analysis and sharing require local files.
 */
export async function ensureLocalFile(uri: string, baseName: string): Promise<string> {
  if (uri.startsWith('file://')) return uri;

  if (uri.startsWith('data:')) {
    const match = /^data:image\/(\w+);base64,(.*)$/.exec(uri);
    if (!match) throw new Error('Image encodée illisible.');
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const file = new File(Paths.cache, `${baseName}-${Date.now()}.${extension}`);
    await file.write(match[2], { encoding: 'base64' });
    return file.uri;
  }

  if (/^https?:\/\//.test(uri)) {
    const file = new File(Paths.cache, `${baseName}-${Date.now()}.jpg`);
    const downloaded = await File.downloadFileAsync(uri, file);
    return downloaded.uri;
  }

  throw new Error('Format d’image non pris en charge.');
}
