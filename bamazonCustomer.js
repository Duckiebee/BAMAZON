
var prompt = require('prompt');
var mysql = require('mysql');
var tto = require('terminal-table-output').create();

var connection = mysql.createConnection({
    host: "localhost",
    port: 8889,
    user: "root", 
    password: "root", 
    database: "bamazon"
});


connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
});

// Display All Items inside Database and sell an item to customer
connection.query('SELECT * FROM Products', function(err, data){
  
  if(err) throw err;


  console.log('Check out what bamazon has in stock for you!\n');

// table header
tto.col("ID").col("Product Name").col("Department Name").col("Price").col("Stock").line();
  
  for(var i = 0; i < data.length; i++){

  	tto.pushrow([data[i].item_id, data[i].product_name, data[i].department_name, data[i].price, data[i].stock_quantity]);

  }

  tto.print(true);


  prompt.start();

 
  console.log('\nWhich item do you want to buy?');
  prompt.get(['buyItemId'], function (err, result1) {
  
    var buyItemId = result1.buyItemId;
    console.log('You selected Item # ' + buyItemId + '.');

    
    console.log('\nHow many do you wish to buy?')
    prompt.get(['buyItemQuantity'], function (err, result2) {

      
      var buyItemQuantity = result2.buyItemQuantity;
      console.log('You selected a quantity of ' + buyItemQuantity + '.');

      connection.query('SELECT stock_quantity FROM Products WHERE ?', [{item_id: buyItemId}], function(err, result3){
        if(err) throw err; 
        console.log(result3);
     
        
        if(!result3[0]){
          console.log('Sorry... We found no items with Item ID "' +  buyItemId + '"');
          connection.end(); 
        }
        
        else{
          var bamazonQuantity = result3[0].stock_quantity;
         
          if(bamazonQuantity >= buyItemQuantity){

           
            var newInventory = parseInt(bamazonQuantity) - parseInt(buyItemQuantity); // ensure we have integers for subtraction & database
            connection.query('UPDATE Products SET ? WHERE ?', [{stock_quantity: newInventory}, {item_id: buyItemId}], function(err, result4){
              if(err) throw err; 
            }); 


            
            var customerTotal;
            connection.query('SELECT Price FROM Products WHERE ?', [{item_id: buyItemId}], function(err, result5){
              
              var buyItemPrice = result5[0].Price;
              customerTotal = buyItemQuantity*buyItemPrice.toFixed(2);

              console.log('\nYour total is $' + customerTotal + '.');
              connection.end();
            }); 
          }
          
          else{
            console.log('Sorry... We only have ' +  bamazonQuantity + ' of those items. Order cancelled.');
            connection.end();
          }
        }

      }); // end item quantity query

    }); // end of prompt 2

  }); // end of prompt 1

}); // end of main query