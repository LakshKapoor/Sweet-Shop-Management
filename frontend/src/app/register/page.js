"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const APIurl = "http://172.25.3.160:3000"

export default function registerPage(){
    const router =useRouter()
    
    const[name, setName] = useState("")
    const[email, setEmail] = useState("")
    const[password, setPassword] = useState("")
    const[error, setError] = useState("")

    const handleRegister = async (e) =>{
        e.preventDefault()

        try{
            const res = await fetch(`${APIurl}/api/auth/register`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({name, email, password}),
            });
            const data = await res.json();
            if(!res.ok){
                setError(data.message)
                return
            }

            router.push("/login")
            
        }
        catch(err){
            setError("Registration failed")
        }
    }


    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Register</h1>
      
            {error && (
              <p className="text-red-500 text-sm text-center mb-3">
                {error}
              </p>
            )}
      
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="Name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
      
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
      
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Register
              </button>
            </form>
            <p className="mt-4 text-center">Already have an account?{" "}
              <button
              className="text-blue-600 underline"
              onClick={()=> router.push("/login")}>
                Login
              </button>
            </p>

          </div>
        </main>
      );
    }
