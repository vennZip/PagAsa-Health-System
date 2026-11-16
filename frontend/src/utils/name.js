// Capitalize only the initial letter; preserve intentional spelling such as McDonald.
export const capitalizeName = (value) => value.replace(/^(\s*)(\p{L})/u, (_, space, letter) => space + letter.toLocaleUpperCase("en-PH"));
