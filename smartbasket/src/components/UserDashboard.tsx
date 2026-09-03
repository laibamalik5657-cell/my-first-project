import React from 'react'
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryModel from '../models/grocery.model'
import GroceryItemCard from './GroceryItemCard'
import connectDb from '@/lib/db'


async function UserDashboard() {
    await connectDb()
    const groceries = await (GroceryModel as any).find({})
    const plainGrocery = JSON.parse(JSON.stringify(groceries))
    
    return (
        <>
            <HeroSection />
            <CategorySlider />
            <div className='w-[90%] md:w-[80%] max-auto mt-10'></div>
            <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>Popular Grocery items</h2>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
                {plainGrocery.map((item: any, index: number) => (
                    <div key={item._id ?? item.id ?? index}>
                        <GroceryItemCard item={item} />
                    </div>
                ))}
            </div>
        </>
    )
}

export default UserDashboard
