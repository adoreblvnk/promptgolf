export function meetsMinimumSpecLength(prompt: string, minimum = 20) {
  return prompt.trim().length >= minimum;
}