'use client';
import type {HTMLAttributes,ReactNode} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {cn} from './cn';
type Props=Omit<HTMLAttributes<HTMLDivElement>,'onDrag'|'onDragStart'|'onDragEnd'>&{children:ReactNode};
export function FloatingCard({className,children,...props}:Props){const reduce=useReducedMotion();return <motion.div whileTap={reduce?undefined:{scale:.985}} transition={{type:'spring',stiffness:420,damping:28}} className={cn('rounded-[20px] border border-line bg-card p-[14px] shadow-float',className)} {...props}>{children}</motion.div>}