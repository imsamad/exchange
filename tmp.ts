const abs: any = {
  arrays: [[1], [2], [3]],
  hello: "",
};
console.log(abs);
abs["hello"] = [];

abs["hello"] = abs.arrays[0];
console.log(abs);
let x = abs.arrays[0];
abs.arrays[0] = abs.arrays[1];
abs.arrays[1] = x;

console.log(abs);

abs.hello[0] = "scd";
console.log(abs);
