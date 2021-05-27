// function Parent() {
//   var game = "tic-tac-toe";
// }

// function Son() {
//   Parent.call(this);
// }

// var s1 = new Son();

// console.log(s1.game);

// function message(a) {
//   console.log("message1");
// }

// message(1, 2);

// function message(a, b) {
//   console.log("message2");
// }

// function message(a, b, c) {
//   console.log("message3");
// }

//console.log(false == ((0 === "0") == 0));

// var a;
// console.log(typeof a);

// function Parent() {
//   this.job = "service";
// }

// function Child() {
//   Parent.call(this);
//   this.job = "business";
// }

// Child.prototype = new Parent();

// var c1 = new Child();

// console.log(c1.job);

// var c = null;

// function display() {
//   var i = 1;
//   return function () {
//     i++;
//     console.log(i);
//   };
// }
// var getValue = display();
// getValue();

// function Employee() {
//   this.id = 2;
// }
// Employee.prototype.id = 3;

// var b1 = new Employee();
// b1.id = 1;

// console.log(b1.id);

// (function (a) {
//   console.log(a);
// })();

// function f() {
//   var i = 1;
// }

// f.prototype = null;

// f.prototype = {
//   i: 2,
// };

// console.log(new f().i);

// (function () {
//   i = 0;
//   while (i < 2) {
//     i++;
//   }
// })();
// console.log(i);

document.getElementById("button1").addEventListener("click", invoke, false);

function invoke() {
  console.log(event.target.id);
}
