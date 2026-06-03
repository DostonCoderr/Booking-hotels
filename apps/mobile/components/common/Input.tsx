import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

interface Props {
  label?: string
  value: string
  onChange: (text: string) => void
  placeholder?: string
  secure?: boolean
  error?: string
  multiline?: boolean
  icon?: keyof typeof Ionicons.glyphMap
}

export function Input({ label, value, onChange, placeholder, secure, error, multiline, icon }: Props) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, multiline && styles.multiline]}>
        {icon && <Ionicons name={icon} size={20} color={COLORS.gray} style={styles.icon} />}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          secureTextEntry={secure && !showPassword}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.primary,
  },
  multiline: {
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.dark,
    paddingVertical: 14,
  },
  multilineInput: {
    paddingTop: 12,
    minHeight: 100,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.primary,
  },
})