"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const APIurl = "http://192.168.29.144:3000"

export default function Loginpage(){
    const router =useRouter()

    const[email, setEmail] = useState("")
    const[password, setPassword] = useState("")
    const[error, setError] = useState("")

    const handleLogin = async (e) =>{
        e.preventDefault()

        try{
            const res = await fetch(`${APIurl}/api/auth/login`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({email, password}),
            });
            const data = await res.json();
            if(!res.ok){
                setError(data.message)
                return
            }
            localStorage.setItem("token", data.token)
            localStorage.setItem("userId", data.userId)
            localStorage.setItem("name", data.name)

            router.push("/dashboard")
        }
        catch(err){
            setError("Login failed")
        }
    }


    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
      
            {error && (
              <p className="text-red-500 text-sm text-center mb-3">
                {error}
              </p>
            )}
      
            <form onSubmit={handleLogin} className="space-y-4">
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
                Login
              </button>
            </form>

            <p className="mt-4 text-center">Don't have an account?{" "}
              <button
              className="text-blue-600 underline"
              onClick={()=> router.push("/register")}>
                Register
              </button>
            </p>

          </div>
        </main>
      );
    }
