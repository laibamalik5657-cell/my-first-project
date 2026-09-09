"use client"
import React from 'react'
import useGetMe from './hooks/useGetMe' 

function initUser() {
  useGetMe()
  return null
}

export default initUser
