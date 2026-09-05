import React, { useState } from 'react';
import { 
    Text, 
    View, 
    TouchableOpacity, 
    StyleSheet, 
    TextInput, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';
import { useAuth } from '../context/AuthContext';
import type { RootStackScreenProps } from '../navigation/types';

export default function SignupScreen({ navigation }: RootStackScreenProps<'Signup'>) {
    const insets = useSafeAreaInsets();
    const { bypassAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async () => {
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created:', userCredential.user.email);
            // AuthContext onAuthStateChanged automatically transitions to MainTabs
        } catch (error: any) {
            console.error('Signup error:', error);
            alert(error.message || 'Signup failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.mainContainer}>
            {/* Background Decorative Shapes (Exactly the same as Login) */}
            <View style={styles.topSemicircle} />
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardContainer}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Header Section */}
                            <View style={styles.headerContainer}>
                                <Text style={styles.title}>Create Account</Text>
                                <Text style={styles.subtitle}>Join us and start your journey</Text>
                            </View>

                        {/* Input Section */}
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput 
                                    placeholder='yourname@example.com' 
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input} 
                                    value={email} 
                                    onChangeText={setEmail} 
                                    autoCapitalize='none' 
                                    keyboardType='email-address' 
                                    editable={!loading} 
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput 
                                        placeholder='••••••••' 
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword} 
                                        style={styles.passwordInput} 
                                        value={password} 
                                        onChangeText={setPassword} 
                                        editable={!loading} 
                                    />
                                    <TouchableOpacity 
                                        style={styles.eyeButton} 
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Text style={styles.eyeText}>
                                            {showPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Action Section */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity 
                                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} 
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity 
                                style={styles.secondaryButton} 
                                onPress={() => alert('Google Auth to be implemented!')}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Sign Up with Google</Text>
                            </TouchableOpacity>

                            {/* Dev Quick Bypass Button */}
                            <TouchableOpacity 
                                style={styles.bypassButton} 
                                onPress={bypassAuth}
                                disabled={loading}
                            >
                                <Text style={styles.bypassButtonText}>⚡ Dev Bypass (Enter App Directly)</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer - Navigates back to Login */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.footerLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        overflow: 'hidden', 

    },
    // --- Decorative Background Shapes ---
    topSemicircle: {
        position: 'absolute',
        top: -300, 
        left: -100,
        right: -100,
        height: 600,
        borderRadius: 300, 
        backgroundColor: '#4F46E5', 
        opacity: 0.1,
    },
    circleOne: {
        position: 'absolute',
        top: 150,
        right: -60,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#818CF8',
        opacity: 0.15,
    },
    circleTwo: {
        position: 'absolute',
        bottom: 100,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#C7D2FE',
        opacity: 0.2,
    },
    // ------------------------------------
    safeArea: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 16,
        color: '#111827',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    eyeButton: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        height: '100%',
    },
    eyeText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 14,
    },
    actionContainer: {
        marginBottom: 30,
    },
    primaryButton: {
        backgroundColor: '#4F46E5', 
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonDisabled: {
        backgroundColor: '#818CF8',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        color: '#6B7280',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    bypassButton: {
        marginTop: 12,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#10B981',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bypassButtonText: {
        color: '#047857',
        fontSize: 14,
        fontWeight: '700',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 15,
    },
    footerLink: {
        color: '#4F46E5',
        fontSize: 15,
        fontWeight: '700',
    },
});