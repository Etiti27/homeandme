require('dotenv').config();
const express= require('express');
const bodyParser=require('body-parser');
const _=require('lodash');
const mongoose=require('mongoose');
const app=express()
const session= require('express-session');
const ejs= require('ejs');
const stripe = require('stripe')('sk_test_51IaTkcC0CwnsvPwnCSYRQIf4sxSypdrzTGavMEGCGSV7zTZLi2J3QtdmDGRYO3gls0S62juXJmBpTN258exlieSf00N6gOxPiK')



// connecting to a database
mongoose.connect("mongodb://localhost:27017/Na'trelDB");
// middlewares

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
app.use('/public', express.static("public"))
app.use(session({
    secret: "secrets",
    resave: false,
    saveUninitialized: false
    
  }));




const homeandmeSchema = new mongoose.Schema({
    name:String,
    description:String,
    salePrice:Number,
    price:Number,
    image:String,
    quantity:String
})

const HOMEANDME= mongoose.model('Product', homeandmeSchema)

const aloevera= new HOMEANDME ({
    name:"Alo evera",
    description:"good for your health",
    salePrice: 29,
    price:40,
    image:"aloevera.png",
    quantity:"1"
})

const Bolos= new HOMEANDME ({
    name:"bolos",
    description:"good for your posture and comfort",
    salePrice: 80,
    price:100,
    image:`Bolos d Olor Mikado Petit Oceano.png`,
    quantity:"1"
})

const Giftset = new HOMEANDME ({
    name:"Giftset splendour frosted black",
    description:"washes good and neat",
    salePrice: 300,
    price:350,
    image:"Giftset splendour frosted black.png",
    quantity:"1"
})
const Green_Tree = new HOMEANDME ({
    name:"Green Tree zeezout aroma Aloë Vera",
    description:"washes good and neat",
    salePrice: 500,
    price:700,
    image:"Green Tree.png",
    quantity:"1"
})


function isProductInCart(cart,id){
    
    cart.forEach(function(cartItem) {
        if(cartItem.id==id){
            return true
        }
        
    });
    return false
}

function calculateTotal(cart, req){
     
   total=0
   console.log(cart)
    cart.forEach(function(cartItem){
       
        if(cartItem.salePrice){
            
             total= total + (cartItem.salePrice*cartItem.quantity)

        
        }else{
            
             total= total + (cartItem.price*cartItem.quantity)
        }
    })
     req.session.total=total
    return total
}





app.get('/', function(req,res){
    HOMEANDME.find({}, function(err,product){
        if(product.length==0){
            HOMEANDME.insertMany([Green_Tree, Giftset,Bolos,aloevera], function(err){
                if(err){
                    console.log(err);
                }
            })
            res.redirect('/')
        }
        res.render('Home', {product:product})
    })
   
})

// add to cart handler
app.post('/add_to_cart', function(req,res){
    const product={
        id:req.body.id,
        name:req.body.name,
        price:req.body.price,
        salePrice:req.body.sale_price,
        image:req.body.image,
        quantity:req.body.quantity
    }
let cart=req.session.cart
let id= product.id
    if(cart){
        if(!isProductInCart(cart,id)){
            cart=req.session.cart
            cart.push(product)
        }
    }
    else{
        req.session.cart=[product] 
         cart= req.session.cart 
    }
   
    calculateTotal(cart,req) 


    res.redirect('/cart')
})
app.get("/cart", function(req,res){
    const total =req.session.total
    const cart= req.session.cart
    res.render('cart', {total:total,cart:cart })
})


app.post('/remove', function(req,res){
    const id=req.body.id
    const cart= req.session.cart

    cart.forEach(function(item) {
        if(item.id==id){
            cart.splice(cart.indexOf(item),1)
        }
       
        
    })

    // for (let i = 0; i < cart.length; i++) {
    //     if(cart.id==id){
    //         cart.splice(cart.indexOf(i),1)
    //     }
        
    // }
    calculateTotal(cart,req)
    res.redirect('/cart')
})

app.post('/edit', function(req,res){
    const increase=req.body.increase
    const id=req.body.id
    const quantity=req.body.quantity
    const decrease= req.body.decrease
    const cart= req.session.cart
    if(increase){
    cart.forEach(function(item){
        if(item.id==id){
            if(item.quantity>=1){
                item.quantity=parseInt(item.quantity)+1
            }

        }
    })
}

if(decrease){
    cart.forEach(function(item){
        if(item.id==id){
            if(item.quantity>1){
                item.quantity=parseInt(item.quantity)-1
            }

        }
    })
}
calculateTotal(cart,req)
res.redirect("/cart")
})

app.get('/checkout', function(req,res){
    const total=req.session.total 
    const key='pk_test_51IaTkcC0CwnsvPwnbFHHD2pZH2U5Or6ssXol8GilWy4BuipO3TOChSj25jAtG8ZkEdelBLJOkuA9KZ3aS7G9G2EF00QfPTaJjE'
    
    res.render('checkout', {key:key, cost:total })
})



app.post("/checkout", (req, res) => {
    
    const orderSchema= new mongoose.Schema({
        firstname:String,
        lastname:String,
        address:String,
        apartment:String,
        country:String,
        email:String,
        phone:String,
        city:String,
        date:String,
        status:String

    })
const ORDER= mongoose.model('Order', orderSchema)
const newOrder=new ORDER({
    firstname:req.body.firstname,
    lastname:req.body.lastname,
    address:req.body.address,
    apartment:req.body.apartment,
    country:req.body.country,
    email:req.body.email,
    phone:req.body.phoneNumber,
    date:new Date(),
    city:req.body.city,
    status:'not paid'
})

newOrder.save();
res.redirect('/payment')

})

app.get('/payment', function(req,res){
    const cost=req.session.total
    const key="pk_test_51IaTkcC0CwnsvPwnbFHHD2pZH2U5Or6ssXol8GilWy4BuipO3TOChSj25jAtG8ZkEdelBLJOkuA9KZ3aS7G9G2EF00QfPTaJjE"
    res.render('payment', {key:key, cost:cost})
})

app.post('/payment', function(req,res){
    const total=req.body.total
    stripe.customers
  .create({
    email: req.body.email,
  })
  .then((customer) => {
    // have access to the customer object
    return stripe.invoiceItems
      .create({
        customer: customer.id, // set the customer id
        amount: total * 100, // 25
        currency: 'usd',
        description: 'One-time setup fee',
      })
      .then(() => res.render("completed.html"))
      .then((invoiceItem) => {
        return stripe.invoices.create({
          collection_method: 'send_invoice',
          customer: invoiceItem.customer,
        });
      })
      .then((invoice) => {
        // New invoice created on a new customer
      })
      .then(() => {
        newOrder.save();
        },
        {status:'paid'}, function(err){
            console.log(err);
        })
      })
      .catch((err) => {
        // Deal with an error
      });
  });



app.listen(3000,function(err){
    if(!err){
        console.log(`connected`)
    }
} )