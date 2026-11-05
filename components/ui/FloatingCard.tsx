'use client';
import type {ComponentProps} from 'react';
import {motion,useReducedMotion} from 'framer-motion';
import {cn} from './cn';
type Props=Omit<ComponentProps<typeof motion.div>,'whileTap'|'transition'>;
export function FloatingCard({className,children,...props}:Props){const reduce=useReducedMotion();return <motion.div whileTap={reduce?undefined:{scale:.985}} transition={{type:'spring',stiffness:420,damping:28}} className={cn('rounded-[20px] border border-line bg-card p-[14px] shadow-float',className)} {...props}>{children}</motion.div>}