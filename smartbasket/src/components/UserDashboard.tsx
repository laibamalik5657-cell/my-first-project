import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryModel, { IGrocery } from '../models/grocery.model'
import GroceryItemCard from './GroceryItemCard'
import connectDb from '@/lib/db'

async function UserDashboard({groceryList}:{groceryList:IGrocery[]}) {
    await connectDb()
   const plainGrocery = groceryList ? JSON.parse(JSON.stringify(groceryList)) : []

return (
  <>
    <HeroSection />
    <CategorySlider />
    
    <div className='w-[90%] md:w-[80%] mx-auto mt-10'>
      <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6'>
        Popular Grocery items
      </h2>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
        {plainGrocery && plainGrocery.length > 0 ? (
          plainGrocery.map((item: any, index: number) => (
            <div key={item._id ?? item.id ?? index}>
              <GroceryItemCard item={item} />
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-6">
            No groceries found.
          </p>
        )}
      </div>
    </div>
  </>
)}

export default UserDashboard
