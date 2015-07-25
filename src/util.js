/*
Provides common string replacement on ID values.
@param id: The ID string.
@returns the formatted value.
*/
export var formatId = (id) => {
  return id
          .replace(/\ /g, "-")
          .replace(/\(/g, "[") // Prevent matching errors for BDD usage of parentheses in ID"s.
          .replace(/\)/g, "]");
};
