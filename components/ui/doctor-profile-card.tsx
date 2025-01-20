"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { PractitionerProfile } from '@/lib/schemas/practitioner'
import Link from 'next/link'

interface DoctorProfileCardProps {
    practitioner: PractitionerProfile
}

const DoctorProfileCard: React.FC<DoctorProfileCardProps> = ({ practitioner }) => {
    return (
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
            <motion.div
                className="relative w-full max-w-lg bg-gradient-to-br from-blue-500/95 via-blue-400/95 to-cyan-400/95 p-6 sm:p-8 rounded-2xl overflow-hidden backdrop-blur-xl"
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
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `
                            radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 2px, transparent 0)
                        `,
                            backgroundSize: '16px 16px'
                        }}
                    />
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
                            <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-white'>
                                {practitioner.name}
                            </h1>
                            <div className='inline-flex items-center gap-2 px-2.5 py-1.5 bg-white/60 backdrop-blur-md border border-white/20 rounded-full'>
                                <div className='relative flex items-center justify-center'>
                                    <div className='w-2 h-2 rounded-full bg-blue-400' />
                                    <div className='absolute w-4 h-4 rounded-full bg-blue-400/40 animate-ping' />
                                    <div className='absolute w-3 h-3 rounded-full bg-blue-400/30 blur-sm' />
                                </div>
                                <span className='text-white/90 text-xs font-medium tracking-wide capitalize'>
                                    {practitioner.consultationType}
                                </span>
                            </div>
                        </div>
                        <div className="bg-white backdrop-blur-md rounded-xl p-2">
                            <div className="text-blue-600 font-semibold">
                                {practitioner.experience}+ yrs
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 bg-white/5 backdrop-blur-sm rounded-xl p-4">
                        <span className='text-blue-100 text-xs uppercase tracking-wider'>Qualification</span>
                        <p className='text-white/90 text-base'>{practitioner.qualification}</p>
                    </div>

                    {/* Fee Display */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                        <div className="text-center space-y-1.5">
                            <span className="text-blue-100 text-xs uppercase tracking-wider">
                                Consultation Fee
                            </span>
                            <p className="text-2xl sm:text-3xl font-bold text-white">
                                ₹{practitioner.fee}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 gap-3">
                        <Link href={`/user/practitioners/${practitioner.userId}`}>
                            <motion.button
                                className='relative bg-white hover:bg-gray-50 px-4 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-blue-600 group overflow-hidden w-full'
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div
                                    className="flex items-center gap-2"
                                    animate={{
                                        x: [0, 2, 0],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    View Profile
                                    <Eye className='size-4' />
                                </motion.div>
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default DoctorProfileCard