import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

const AnimatedCardBalance = () => {
    const [showBalance, setShowBalance] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const finalBalance = 50000
    const audioRef = useRef(new Audio('https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcUUzG4vrHo1YhFXmiTgQ84RDvW0rajlnKqbes'))
    const lastPlayedRef = useRef(0)


    const handleBalanceClick = async () => {
        try {
            if (!showBalance) {
                const audio = audioRef.current;
                await audio.play();
                setIsAnimating(true);
            }
            setShowBalance(!showBalance);
        } catch (error) {
            console.error('Audio play error:', error);
            // Still toggle balance even if audio fails
            setShowBalance(!showBalance);
            setIsAnimating(true);
        }
    };

    useEffect(() => {
        const audio = audioRef.current
        audio.volume = 0.5
        const handleAudioEnd = () => setIsAnimating(false)
        audio.addEventListener('ended', handleAudioEnd)
        return () => {
            audio.removeEventListener('ended', handleAudioEnd)
            audio.pause()
            audio.currentTime = 0
        }
    }, [])

    const playCountSound = () => {
        const now = Date.now()
        if (now - lastPlayedRef.current > 2000) {
            const audio = audioRef.current
            audio.pause()
            audio.currentTime = 0
            audio.play().then(() => lastPlayedRef.current = now).catch(console.error)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value)
    }

    const CountUp = ({ end, duration }: { end: number; duration: number }) => {
        const [count, setCount] = useState(0)
        const previousCount = useRef(count)

        useEffect(() => {
            if (!isAnimating) {
                setCount(end)
                return
            }

            let startTime: number
            let animationFrame: number

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime
                const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
                const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
                const newCount = Math.min(end * easedProgress, end)

                setCount(newCount)

                if (Math.floor(newCount / 1000) > Math.floor(previousCount.current / 1000)) {
                    playCountSound()
                }

                previousCount.current = newCount

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate)
                }
            }

            animationFrame = requestAnimationFrame(animate)
            return () => cancelAnimationFrame(animationFrame)
        }, [end, duration, isAnimating])

        return <>{formatCurrency(Math.floor(count))}</>
    }

    return (
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px] ">

            <motion.div
                className="relative w-full max-w-lg bg-gradient-to-br from-green-500/95 via-green-400/95 to-emerald-400/95 p-6 sm:p-8 rounded-2xl overflow-hidden backdrop-blur-xl"
                style={{
                    boxShadow: `
                    0 5px 15px -3px rgba(0, 0, 0, 0.1),
                    0 4px 6px -4px rgba(0, 0, 0, 0.1),
                    0 10px 30px -3px rgba(0, 0, 0, 0.15),
                    inset 0 1px 1px rgba(255, 255, 255, 0.2)
                `
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Card Pattern */}
                <div className="absolute inset-0">
                    {/* Dot Pattern */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `
                            radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 2px, transparent 0)
                        `,
                            backgroundSize: '16px 16px'
                        }}
                    />
                    {/* Light Reflection */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, transparent 60%)'
                        }}
                    />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className='flex justify-between items-start w-full'>
                        <div className='space-y-1.5'>
                            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-white'>SBI Bank</h1>
                            <div className='inline-flex items-center gap-2 px-2.5 py-1.5 bg-white/60 backdrop-blur-md border border-white/20 rounded-full'>
                                <div className='relative flex items-center justify-center'>
                                    {/* Main dot */}
                                    <div className='w-2 h-2 rounded-full bg-green-400 ' />
                                    {/* Ping animation */}
                                    <div className='absolute w-4 h-4 rounded-full bg-green-400/40 animate-ping' />
                                    {/* Glow effect */}
                                    <div className='absolute w-3 h-3 rounded-full bg-green-400/30 blur-sm' />
                                </div>
                                <span className='text-white/90 text-xs font-medium tracking-wide'>Active</span>
                            </div>
                        </div>
                        <div className="bg-white backdrop-blur-md rounded-xl p-2">
                            <Image
                                src="https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkchB7yrsruRgSdW3wcFunAvNQ8L5x0UyOHVBZp"
                                alt="Bank Logo"
                                width={32}
                                height={32}
                                className='rounded-lg'
                            />
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-1.5 bg-white/5 backdrop-blur-sm rounded-xl py-4">
                        <span className='text-green-100 text-xs uppercase tracking-wider'>Account Number</span>
                        <p className='font-mono text-white/90 text-base'>**** **** **** 1234</p>
                    </div>

                    {/* Balance Display */}
                    <AnimatePresence mode="wait">
                        {showBalance && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    transition: { duration: 0.2 }
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    transition: { duration: 0.15 }
                                }}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4"
                            >
                                <div className="text-center space-y-1.5">
                                    <span className="text-green-100 text-xs uppercase tracking-wider">
                                        Available Balance
                                    </span>
                                    <p className="text-2xl sm:text-3xl font-bold text-white">
                                        <CountUp end={finalBalance} duration={2.5} />
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            className='flex gap-2 items-center bg-white/20 hover:bg-white/20 px-4 py-3 rounded-xl text-sm font-medium transition-all justify-center text-white backdrop-blur-md'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Add Money <Plus className='size-4' />
                        </motion.button>

                        <motion.button
                            className='relative bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-green-600 group overflow-hidden'
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBalanceClick}
                        >
                            <motion.div
                                className="flex items-center gap-2"
                                animate={!showBalance ? {
                                    x: [0, 2, 0],
                                } : {}}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                {showBalance ? (
                                    <>Hide Balance <EyeOff className='size-4' /></>
                                ) : (
                                    <>
                                        Check Balance
                                        <motion.div

                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Eye className='size-4' />
                                        </motion.div>
                                    </>
                                )}
                            </motion.div>
                        </motion.button>
                    </div>
                </div>
            </motion.div>

        </div>
    )
}

export default AnimatedCardBalance