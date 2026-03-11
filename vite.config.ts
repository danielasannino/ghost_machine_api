import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import React from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    React(),
  ],
})
