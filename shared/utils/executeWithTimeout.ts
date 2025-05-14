export default async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Your promise timed out!',
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}
