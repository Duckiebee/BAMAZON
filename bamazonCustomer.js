// Require prompt node package 
var prompt = require('prompt');
// Require mySQL node package
var mysql = require('mysql');
// Require table node package
var tto = require('terminal-table-output').create();

// Link to mySQL Database
var connection = mysql.createConnection({
    host: "localhost",
    port: 8889,
    user: "root", //Your username
    password: "root", //Your password
    database: "bamazon"
});

// Connect to Database
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
});

// Display All Items inside Database and sell an item to customer
connection.query('SELECT * FROM Products', function(err, data){
  
  // Error Handler
  if(err) throw err;


  console.log('Check out what bamazon has in stock for you!\n');

// Set up table header
tto.col("ID").col("Product Name").col("Department Name").col("Price").col("Stock").line();
  
  for(var i = 0; i < data.length; i++){

  	tto.pushrow([data[i].item_id, data[i].product_name, data[i].department_name, data[i].price, data[i].stock_quantity]);

  }

  tto.print(true);

  // After the table is shown, ask the user to buy something
  prompt.start();

  // Ask for Item ID
  console.log('\nWhich item do you want to buy?');
  prompt.get(['buyItemId'], function (err, result1) {
    
    // Show Item ID selected
    var buyItemId = result1.buyItemId;
    console.log('You selected Item # ' + buyItemId + '.');

    // Then ask for Quanity (once user completed first entry)
    console.log('\nHow many do you wish to buy?')
    prompt.get(['buyItemQuantity'], function (err, result2) {

      // Show quantity selected
      var buyItemQuantity = result2.buyItemQuantity;
      console.log('You selected a quantity of ' + buyItemQuantity + '.');

      // Once the customer has placed the order, check if store has enough of the product to meet the request
      connection.query('SELECT stock_quantity FROM Products WHERE ?', [{item_id: buyItemId}], function(err, result3){
        if(err) throw err; // Error Handler
        console.log(result3);
     
        // Check if the item Id was valid (i.e. something was returned from mySQL)
        if(result3[0] == undefined){
          console.log('Sorry... We found no items with Item ID "' +  buyItemId + '"');
          connection.end(); // end the script/connection
        }
        // Valid Item ID, so compare Bamazon Inventory with user quantity 
        else{
          var bamazonQuantity = result3[0].stock_quantity;
          // Sufficient inventory
          if(bamazonQuantity >= buyItemQuantity){

            // Update mySQL database with reduced inventory
            var newInventory = parseInt(bamazonQuantity) - parseInt(buyItemQuantity); // ensure we have integers for subtraction & database
            connection.query('UPDATE Products SET ? WHERE ?', [{stock_quantity: newInventory}, {item_id: buyItemId}], function(err, result4){
              if(err) throw err; // Error Handler
            }); // end inventory update query


            // Show customer their purchase total (need to query the price info from database)
            var customerTotal;
            connection.query('SELECT Price FROM Products WHERE ?', [{item_id: buyItemId}], function(err, result5){
              console.log(result5);
              var buyItemPrice = result5[0].Price;
              customerTotal = buyItemQuantity*buyItemPrice.toFixed(2);

              console.log('\nYour total is $' + customerTotal + '.');
              connection.end();
            }); // end customer purchase update query 
          }
          // Insufficient inventory
          else{
            console.log('Sorry... We only have ' +  bamazonQuantity + ' of those items. Order cancelled.');
            connection.end(); // end the script/connection
          }
        }

      }); // end item quantity query

    }); // end of prompt 2

  }); // end of prompt 1

}); // end of main query