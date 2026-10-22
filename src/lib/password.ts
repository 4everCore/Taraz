import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export function passwordStrengthIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) {
    issues.push("رمز عبور باید حداقل ۸ کاراکتر باشد");
  }
  if (!/[a-zA-Z]/.test(password)) {
    issues.push("رمز عبور باید شامل حداقل یک حرف باشد");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("رمز عبور باید شامل حداقل یک رقم باشد");
  }
  return issues;
}
