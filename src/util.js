/*
Provides common string replacement on ID values.
@param id: The ID string.
@returns the formatted value.
*/
export const formatId = (id) => id
    .replace(/\ /g, '-')
    .replace(/\(/g, '[') // Prevent matching errors for BDD usage of parentheses in ID's.
    .replace(/\)/g, ']');
