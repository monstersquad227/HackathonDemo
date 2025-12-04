import { registrationApi } from '../api/registrationApi'
import { checkinApi } from '../api/checkinApi'

/**
 * 验证用户是否报名参加了活动
 * @param {string} eventId - 活动ID
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<{isRegistered: boolean, registration: object|null}>}
 */
export const validateRegistration = async (eventId, walletAddress) => {
  try {
    const registrations = await registrationApi.getRegistrationsByEvent(eventId)
    const registration = registrations.find(
      (reg) => reg.wallet_address && 
      reg.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    )
    return {
      isRegistered: !!registration,
      registration: registration || null,
    }
  } catch (err) {
    console.error('验证报名状态失败:', err)
    return {
      isRegistered: false,
      registration: null,
      error: err.message,
    }
  }
}

/**
 * 验证用户是否完成了签到
 * @param {string} eventId - 活动ID
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<{isCheckedIn: boolean, checkIn: object|null}>}
 */
export const validateCheckIn = async (eventId, walletAddress) => {
  try {
    const checkIn = await checkinApi.getUserCheckIn(eventId, walletAddress)
    return {
      isCheckedIn: !!checkIn,
      checkIn: checkIn || null,
    }
  } catch (err) {
    // 如果用户未签到，API 可能会返回 404，这是正常的
    if (err.response?.status === 404) {
      return {
        isCheckedIn: false,
        checkIn: null,
      }
    }
    console.error('验证签到状态失败:', err)
    return {
      isCheckedIn: false,
      checkIn: null,
      error: err.message,
    }
  }
}

/**
 * 验证用户是否报名并完成了签到
 * @param {string} eventId - 活动ID
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<{isRegistered: boolean, isCheckedIn: boolean, registration: object|null, checkIn: object|null}>}
 */
export const validateRegistrationAndCheckIn = async (eventId, walletAddress) => {
  const [registrationResult, checkInResult] = await Promise.all([
    validateRegistration(eventId, walletAddress),
    validateCheckIn(eventId, walletAddress),
  ])

  return {
    isRegistered: registrationResult.isRegistered,
    isCheckedIn: checkInResult.isCheckedIn,
    registration: registrationResult.registration,
    checkIn: checkInResult.checkIn,
  }
}

