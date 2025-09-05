import { defineStore } from 'pinia'

interface AuthState {
    token: string | null
    user: null | object
    lastActivity: number
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: localStorage.getItem('token') || null,
        user: null,
        lastActivity: Date.now()
    }),

    actions: {
        setToken(token: string): void {
            this.token = token
            localStorage.setItem('token', token)
            this.updateActivity()
        },

        clearToken(): void {
            this.token = null
            localStorage.removeItem('token')
        },

        updateActivity(): void {
            this.lastActivity = Date.now()
        },

        checkTimeout(): boolean {
            const timeout = 5 * 60 * 1000 // 5分钟
            if (Date.now() - this.lastActivity > timeout) {
                this.clearToken()
                return true
            }
            return false
        }
    }
})
