import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
    const [message, setMessage] = useState('Menghubungkan ke Laravel...')

    useEffect(() => {
        axios
            .get('http://127.0.0.1:8001/api/test')
            .then((response) => {
                setMessage(response.data.message)
            })
            .catch((error) => {
                console.error('API Error:', error)
                setMessage('Gagal terhubung ke Laravel')
            })
    }, [])

    return (
        <div>
            <h1>Inventaris</h1>
            <p>{message}</p>
        </div>
    )
}

export default App