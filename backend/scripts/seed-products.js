// backend/scripts/seed-products.js
// Erstellt Beispiel-Produkte für Restaurant

const { 
  User, 
  Category, 
  Product, 
  Ingredient, 
  ProductIngredient 
} = require('../src/models');

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...\n');

    // 1. Get Admin User
    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.error('❌ No admin user found! Run create-admin.js first.');
      process.exit(1);
    }

    // 2. Create Categories
    console.log('📁 Creating categories...');
    const categories = await Promise.all([
      Category.findOrCreate({ 
        where: { name: 'Pizza' },
        defaults: { color: '#FF6B6B', icon: '🍕', sortOrder: 1 }
      }),
      Category.findOrCreate({ 
        where: { name: 'Pasta' },
        defaults: { color: '#4ECDC4', icon: '🍝', sortOrder: 2 }
      }),
      Category.findOrCreate({ 
        where: { name: 'Salad' },
        defaults: { color: '#95E1D3', icon: '🥗', sortOrder: 3 }
      }),
      Category.findOrCreate({ 
        where: { name: 'Burger' },
        defaults: { color: '#F38181', icon: '🍔', sortOrder: 4 }
      }),
      Category.findOrCreate({ 
        where: { name: 'Dessert' },
        defaults: { color: '#AA96DA', icon: '🍰', sortOrder: 5 }
      }),
      Category.findOrCreate({ 
        where: { name: 'Drinks' },
        defaults: { color: '#FCBAD3', icon: '🥤', sortOrder: 6 }
      })
    ]);

    const categoryMap = {
      pizza: categories[0][0],
      pasta: categories[1][0],
      salad: categories[2][0],
      burger: categories[3][0],
      dessert: categories[4][0],
      drinks: categories[5][0]
    };
    console.log('✅ Categories created\n');

    // 3. Create Ingredients
    console.log('🥬 Creating ingredients...');
    const ingredients = {
      // Pizza Ingredients
      dough: await Ingredient.findOrCreate({
        where: { name: 'Pizza Dough' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.003,
          stockQuantity: 5000,
          minStock: 1000,
          supplier: 'Local Bakery'
        }
      }).then(r => r[0]),
      
      tomatoSauce: await Ingredient.findOrCreate({
        where: { name: 'Tomato Sauce' },
        defaults: { 
          unit: 'ml', 
          pricePerUnit: 0.005,
          stockQuantity: 3000,
          minStock: 500,
          allergens: []
        }
      }).then(r => r[0]),
      
      mozzarella: await Ingredient.findOrCreate({
        where: { name: 'Mozzarella Cheese' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.012,
          stockQuantity: 4000,
          minStock: 800,
          allergens: ['dairy'],
          supplier: 'Cheese Factory'
        }
      }).then(r => r[0]),
      
      basil: await Ingredient.findOrCreate({
        where: { name: 'Fresh Basil' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.08,
          stockQuantity: 200,
          minStock: 50,
          shelfLife: 7
        }
      }).then(r => r[0]),
      
      pepperoni: await Ingredient.findOrCreate({
        where: { name: 'Pepperoni' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.018,
          stockQuantity: 2000,
          minStock: 400
        }
      }).then(r => r[0]),
      
      mushrooms: await Ingredient.findOrCreate({
        where: { name: 'Mushrooms' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.007,
          stockQuantity: 1500,
          minStock: 300
        }
      }).then(r => r[0]),
      
      // Pasta Ingredients
      spaghetti: await Ingredient.findOrCreate({
        where: { name: 'Spaghetti' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.004,
          stockQuantity: 6000,
          minStock: 1000,
          allergens: ['gluten']
        }
      }).then(r => r[0]),
      
      cream: await Ingredient.findOrCreate({
        where: { name: 'Heavy Cream' },
        defaults: { 
          unit: 'ml', 
          pricePerUnit: 0.008,
          stockQuantity: 2000,
          minStock: 400,
          allergens: ['dairy'],
          shelfLife: 10
        }
      }).then(r => r[0]),
      
      parmesan: await Ingredient.findOrCreate({
        where: { name: 'Parmesan Cheese' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.025,
          stockQuantity: 1000,
          minStock: 200,
          allergens: ['dairy']
        }
      }).then(r => r[0]),
      
      bacon: await Ingredient.findOrCreate({
        where: { name: 'Bacon' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.015,
          stockQuantity: 1500,
          minStock: 300
        }
      }).then(r => r[0]),
      
      // Salad Ingredients
      lettuce: await Ingredient.findOrCreate({
        where: { name: 'Lettuce' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.003,
          stockQuantity: 2000,
          minStock: 400,
          shelfLife: 5
        }
      }).then(r => r[0]),
      
      tomato: await Ingredient.findOrCreate({
        where: { name: 'Tomatoes' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.004,
          stockQuantity: 3000,
          minStock: 600
        }
      }).then(r => r[0]),
      
      cucumber: await Ingredient.findOrCreate({
        where: { name: 'Cucumber' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.003,
          stockQuantity: 2000,
          minStock: 400
        }
      }).then(r => r[0]),
      
      oliveoil: await Ingredient.findOrCreate({
        where: { name: 'Olive Oil' },
        defaults: { 
          unit: 'ml', 
          pricePerUnit: 0.015,
          stockQuantity: 3000,
          minStock: 500
        }
      }).then(r => r[0]),
      
      // Burger Ingredients
      beefPatty: await Ingredient.findOrCreate({
        where: { name: 'Beef Patty' },
        defaults: { 
          unit: 'piece', 
          pricePerUnit: 2.50,
          stockQuantity: 100,
          minStock: 20,
          shelfLife: 3
        }
      }).then(r => r[0]),
      
      burgerBun: await Ingredient.findOrCreate({
        where: { name: 'Burger Bun' },
        defaults: { 
          unit: 'piece', 
          pricePerUnit: 0.50,
          stockQuantity: 150,
          minStock: 30,
          allergens: ['gluten'],
          shelfLife: 5
        }
      }).then(r => r[0]),
      
      cheddar: await Ingredient.findOrCreate({
        where: { name: 'Cheddar Cheese' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.015,
          stockQuantity: 2000,
          minStock: 400,
          allergens: ['dairy']
        }
      }).then(r => r[0]),
      
      onion: await Ingredient.findOrCreate({
        where: { name: 'Onions' },
        defaults: { 
          unit: 'g', 
          pricePerUnit: 0.002,
          stockQuantity: 3000,
          minStock: 600
        }
      }).then(r => r[0])
    };
    console.log('✅ Ingredients created\n');

    // 4. Create Products with Recipes
    console.log('🍽️  Creating products...\n');

    const products = [];

    // PIZZAS
    const margherita = await Product.findOrCreate({
      where: { name: 'Pizza Margherita' },
      defaults: {
        categoryId: categoryMap.pizza.id,
        price: 9.90,
        description: 'Classic Italian pizza with tomato, mozzarella, and basil',
        instructions: '1. Roll out pizza dough\n2. Spread tomato sauce\n3. Add mozzarella\n4. Bake at 250°C for 12 minutes\n5. Top with fresh basil',
        prepTime: 15,
        cookTime: 12,
        servings: 1,
        difficulty: 'easy',
        tags: ['vegetarian', 'classic', 'italian'],
        isActive: true,
        sortOrder: 1
      }
    });
    products.push(margherita[0]);

    const pepperoniPizza = await Product.findOrCreate({
      where: { name: 'Pizza Pepperoni' },
      defaults: {
        categoryId: categoryMap.pizza.id,
        price: 12.90,
        description: 'Classic pepperoni pizza with extra cheese',
        instructions: '1. Roll out pizza dough\n2. Spread tomato sauce\n3. Add mozzarella\n4. Top with pepperoni\n5. Bake at 250°C for 12 minutes',
        prepTime: 15,
        cookTime: 12,
        servings: 1,
        difficulty: 'easy',
        tags: ['popular', 'meaty'],
        isActive: true,
        sortOrder: 2
      }
    });
    products.push(pepperoniPizza[0]);

    const funghi = await Product.findOrCreate({
      where: { name: 'Pizza Funghi' },
      defaults: {
        categoryId: categoryMap.pizza.id,
        price: 11.50,
        description: 'Pizza with mushrooms and mozzarella',
        instructions: '1. Roll out pizza dough\n2. Spread tomato sauce\n3. Add sautéed mushrooms\n4. Top with mozzarella\n5. Bake at 250°C for 12 minutes',
        prepTime: 18,
        cookTime: 12,
        servings: 1,
        difficulty: 'easy',
        tags: ['vegetarian', 'mushroom'],
        isActive: true,
        sortOrder: 3
      }
    });
    products.push(funghi[0]);

    // PASTA
    const carbonara = await Product.findOrCreate({
      where: { name: 'Spaghetti Carbonara' },
      defaults: {
        categoryId: categoryMap.pasta.id,
        price: 13.50,
        description: 'Classic Roman pasta with bacon, eggs, and parmesan',
        instructions: '1. Cook spaghetti al dente\n2. Fry bacon until crispy\n3. Mix eggs with parmesan\n4. Toss hot pasta with bacon\n5. Add egg mixture off heat\n6. Season and serve immediately',
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        difficulty: 'medium',
        tags: ['italian', 'classic', 'creamy'],
        isActive: true,
        sortOrder: 1
      }
    });
    products.push(carbonara[0]);

    const alfredo = await Product.findOrCreate({
      where: { name: 'Fettuccine Alfredo' },
      defaults: {
        categoryId: categoryMap.pasta.id,
        price: 12.90,
        description: 'Creamy pasta with parmesan and butter',
        instructions: '1. Cook fettuccine al dente\n2. Heat cream and butter\n3. Add parmesan gradually\n4. Toss with pasta\n5. Season with black pepper',
        prepTime: 8,
        cookTime: 12,
        servings: 1,
        difficulty: 'easy',
        tags: ['vegetarian', 'creamy', 'rich'],
        isActive: true,
        sortOrder: 2
      }
    });
    products.push(alfredo[0]);

    // SALADS
    const caesar = await Product.findOrCreate({
      where: { name: 'Caesar Salad' },
      defaults: {
        categoryId: categoryMap.salad.id,
        price: 8.90,
        description: 'Fresh romaine lettuce with Caesar dressing and parmesan',
        instructions: '1. Wash and dry lettuce\n2. Make Caesar dressing\n3. Toss lettuce with dressing\n4. Top with parmesan shavings\n5. Add croutons if desired',
        prepTime: 10,
        cookTime: 0,
        servings: 1,
        difficulty: 'easy',
        tags: ['vegetarian', 'healthy', 'fresh'],
        isActive: true,
        sortOrder: 1
      }
    });
    products.push(caesar[0]);

    const garden = await Product.findOrCreate({
      where: { name: 'Garden Salad' },
      defaults: {
        categoryId: categoryMap.salad.id,
        price: 7.50,
        description: 'Mixed fresh vegetables with olive oil dressing',
        instructions: '1. Wash all vegetables\n2. Cut lettuce, tomatoes, cucumber\n3. Mix in bowl\n4. Drizzle with olive oil\n5. Season with salt and pepper',
        prepTime: 8,
        cookTime: 0,
        servings: 1,
        difficulty: 'easy',
        tags: ['vegan', 'healthy', 'light'],
        isActive: true,
        sortOrder: 2
      }
    });
    products.push(garden[0]);

    // BURGERS
    const cheeseburger = await Product.findOrCreate({
      where: { name: 'Classic Cheeseburger' },
      defaults: {
        categoryId: categoryMap.burger.id,
        price: 11.90,
        description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato',
        instructions: '1. Grill beef patty to desired doneness\n2. Toast burger bun\n3. Melt cheddar on patty\n4. Assemble: bun, lettuce, patty, tomato, onion\n5. Add condiments and top bun',
        prepTime: 5,
        cookTime: 8,
        servings: 1,
        difficulty: 'easy',
        tags: ['classic', 'hearty', 'popular'],
        isActive: true,
        sortOrder: 1
      }
    });
    products.push(cheeseburger[0]);

    // DRINKS (No recipe needed)
    const cola = await Product.findOrCreate({
      where: { name: 'Coca Cola' },
      defaults: {
        categoryId: categoryMap.drinks.id,
        price: 2.50,
        description: 'Classic Coca Cola 0.33L',
        isActive: true,
        sortOrder: 1
      }
    });
    products.push(cola[0]);

    const water = await Product.findOrCreate({
      where: { name: 'Still Water' },
      defaults: {
        categoryId: categoryMap.drinks.id,
        price: 2.00,
        description: 'Still mineral water 0.5L',
        isActive: true,
        sortOrder: 2
      }
    });
    products.push(water[0]);

    console.log(`✅ ${products.length} products created\n`);

    // 5. Link Ingredients to Products
    console.log('🔗 Linking ingredients to products...\n');

    // Pizza Margherita Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: margherita[0].id,
        ingredientId: ingredients.dough.id
      },
      defaults: {
        quantity: 300,
        unit: 'g',
        sortOrder: 1
      }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: margherita[0].id,
        ingredientId: ingredients.tomatoSauce.id
      },
      defaults: {
        quantity: 100,
        unit: 'ml',
        sortOrder: 2
      }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: margherita[0].id,
        ingredientId: ingredients.mozzarella.id
      },
      defaults: {
        quantity: 150,
        unit: 'g',
        sortOrder: 3
      }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: margherita[0].id,
        ingredientId: ingredients.basil.id
      },
      defaults: {
        quantity: 5,
        unit: 'g',
        preparationNote: 'Fresh, added after baking',
        sortOrder: 4
      }
    });

    // Pizza Pepperoni Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: pepperoniPizza[0].id,
        ingredientId: ingredients.dough.id
      },
      defaults: { quantity: 300, unit: 'g', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: pepperoniPizza[0].id,
        ingredientId: ingredients.tomatoSauce.id
      },
      defaults: { quantity: 100, unit: 'ml', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: pepperoniPizza[0].id,
        ingredientId: ingredients.mozzarella.id
      },
      defaults: { quantity: 180, unit: 'g', sortOrder: 3 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: pepperoniPizza[0].id,
        ingredientId: ingredients.pepperoni.id
      },
      defaults: { quantity: 80, unit: 'g', sortOrder: 4 }
    });

    // Pizza Funghi Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: funghi[0].id,
        ingredientId: ingredients.dough.id
      },
      defaults: { quantity: 300, unit: 'g', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: funghi[0].id,
        ingredientId: ingredients.tomatoSauce.id
      },
      defaults: { quantity: 100, unit: 'ml', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: funghi[0].id,
        ingredientId: ingredients.mushrooms.id
      },
      defaults: { quantity: 120, unit: 'g', preparationNote: 'Sliced and sautéed', sortOrder: 3 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: funghi[0].id,
        ingredientId: ingredients.mozzarella.id
      },
      defaults: { quantity: 150, unit: 'g', sortOrder: 4 }
    });

    // Spaghetti Carbonara Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: carbonara[0].id,
        ingredientId: ingredients.spaghetti.id
      },
      defaults: { quantity: 200, unit: 'g', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: carbonara[0].id,
        ingredientId: ingredients.bacon.id
      },
      defaults: { quantity: 100, unit: 'g', preparationNote: 'Diced', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: carbonara[0].id,
        ingredientId: ingredients.parmesan.id
      },
      defaults: { quantity: 50, unit: 'g', preparationNote: 'Grated', sortOrder: 3 }
    });

    // Fettuccine Alfredo Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: alfredo[0].id,
        ingredientId: ingredients.spaghetti.id
      },
      defaults: { quantity: 200, unit: 'g', preparationNote: 'Use fettuccine if available', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: alfredo[0].id,
        ingredientId: ingredients.cream.id
      },
      defaults: { quantity: 150, unit: 'ml', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: alfredo[0].id,
        ingredientId: ingredients.parmesan.id
      },
      defaults: { quantity: 60, unit: 'g', preparationNote: 'Freshly grated', sortOrder: 3 }
    });

    // Caesar Salad Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: caesar[0].id,
        ingredientId: ingredients.lettuce.id
      },
      defaults: { quantity: 150, unit: 'g', preparationNote: 'Romaine lettuce preferred', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: caesar[0].id,
        ingredientId: ingredients.parmesan.id
      },
      defaults: { quantity: 30, unit: 'g', preparationNote: 'Shaved', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: caesar[0].id,
        ingredientId: ingredients.oliveoil.id
      },
      defaults: { quantity: 20, unit: 'ml', sortOrder: 3 }
    });

    // Garden Salad Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: garden[0].id,
        ingredientId: ingredients.lettuce.id
      },
      defaults: { quantity: 100, unit: 'g', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: garden[0].id,
        ingredientId: ingredients.tomato.id
      },
      defaults: { quantity: 80, unit: 'g', preparationNote: 'Diced', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: garden[0].id,
        ingredientId: ingredients.cucumber.id
      },
      defaults: { quantity: 60, unit: 'g', preparationNote: 'Sliced', sortOrder: 3 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: garden[0].id,
        ingredientId: ingredients.oliveoil.id
      },
      defaults: { quantity: 15, unit: 'ml', sortOrder: 4 }
    });

    // Cheeseburger Ingredients
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.beefPatty.id
      },
      defaults: { quantity: 1, unit: 'piece', sortOrder: 1 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.burgerBun.id
      },
      defaults: { quantity: 1, unit: 'piece', sortOrder: 2 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.cheddar.id
      },
      defaults: { quantity: 50, unit: 'g', preparationNote: 'Sliced', sortOrder: 3 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.lettuce.id
      },
      defaults: { quantity: 20, unit: 'g', sortOrder: 4 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.tomato.id
      },
      defaults: { quantity: 40, unit: 'g', preparationNote: 'Sliced', sortOrder: 5 }
    });
    await ProductIngredient.findOrCreate({
      where: { 
        productId: cheeseburger[0].id,
        ingredientId: ingredients.onion.id
      },
      defaults: { quantity: 20, unit: 'g', preparationNote: 'Sliced rings', isOptional: true, sortOrder: 6 }
    });

    console.log('✅ All ingredients linked to products\n');

    console.log('🎉 SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - ${Object.keys(categoryMap).length} categories`);
    console.log(`   - ${Object.keys(ingredients).length} ingredients`);
    console.log(`   - ${products.length} products`);
    console.log('\n✨ Your restaurant is ready to serve!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProducts();