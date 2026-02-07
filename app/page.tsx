"use client"
import { SignUpButton } from "@clerk/nextjs"
import Link from "next/link"

export default function Page() {
  return (
    <div className='page-container'>
      <div className='page-bg-gradient'></div>
      <div className='page-accent-light'></div>

      <div className='relative z-10'>
        {/* Hero Section */}
        <div className='hero-section'>
          <div className='w-full max-w-3xl mx-auto'>
            <h1 className='hero-title'>Vitae</h1>
            <p className='hero-subtitle'>Resume Version Control</p>
            <p className='hero-description'>Manage your career and resumes all in one place.</p>
            <div className='flex items-center justify-center gap-4'>
              <Link href='/auth/sign-up'>
                <button className='btn-primary'>Get Started</button>
              </Link>
            </div>
          </div>
        </div>

        {/* Why Vitae */}
        <div className='content-section py-8'>
          <h2 className='section-title'>Why Vitae?</h2>
          <p className='section-text'>
            Tailoring resumes for different positions (robotics vs. web development vs. embedded systems) is tedious, messy, and error-prone. People maintain
            multiple Word documents, lose track of which version they sent where, and spend hours manually rewriting the same experiences for different
            audiences.
          </p>
        </div>

        {/* What You Get */}
        <div className='content-section py-8'>
          <h2 className='section-title'>What You Get</h2>
          <p className='section-text mb-6'>A resume builder that combines:</p>
          <ul className='space-y-3 text-lg text-gray-600'>
            <li className='flex items-start gap-3'>
              <span className='text-blue-600 font-semibold mt-1'>•</span>
              <span>Modern editor with professional typesetting</span>
            </li>
            <li className='flex items-start gap-3'>
              <span className='text-blue-600 font-semibold mt-1'>•</span>
              <span>Automatic version control for every change made</span>
            </li>
            <li className='flex items-start gap-3'>
              <span className='text-blue-600 font-semibold mt-1'>•</span>
              <span>AI that tailors your resume for each job</span>
            </li>
          </ul>
        </div>

        {/* How It Works */}
        <div className='content-section py-8'>
          <h2 className='section-title'>How It Works</h2>
          <p className='section-text'>
            Once you sign up, save your complete career history. This becomes your canonical record. Every change you make automatically creates a
            working commit (no staging required). When you&apos;re ready, name your commit to finalize a version. Branch your resume for different
            industries and let AI help tailor each one.
          </p>
        </div>

        <footer className='border-t border-gray-200 py-8'></footer>
      </div>
    </div>
  )
}
