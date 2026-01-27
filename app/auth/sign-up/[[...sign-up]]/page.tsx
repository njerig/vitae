import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className='flex flex-col justify-center items-center gap-4'>
      <h1 className='text-5xl'>To continue to Vitae, please sign up</h1>
      <SignUp />
    </div>
  )
}
