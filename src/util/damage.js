export function calcularDaño(pocionColor, fantasmaColor) {
  return pocionColor === fantasmaColor ? 50 : 20;
}