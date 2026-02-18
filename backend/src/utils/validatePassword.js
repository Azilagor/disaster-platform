function validatePassword(password) {
  const p = String(password || "");

  if (p.length < 8) return "Пароль должен быть минимум 8 символов";
  if (!/[A-ZА-Я]/.test(p)) return "Добавьте хотя бы одну заглавную букву";
  if (!/[a-zа-я]/.test(p)) return "Добавьте хотя бы одну строчную букву";
  if (!/\d/.test(p)) return "Добавьте хотя бы одну цифру";

  return null; 
}

module.exports = validatePassword;
