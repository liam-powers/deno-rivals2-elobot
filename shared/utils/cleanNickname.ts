export default function cleanNickname(nickname: string): string {
    // Remove the pattern (1503|#766) from the end of the nickname
    return nickname.replace(/\s*\(\d+\|#?\d+\)$/, '');
  } 