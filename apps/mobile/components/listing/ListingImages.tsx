import { useState, useRef } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Modal
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'

const { width, height } = Dimensions.get('window')

interface Props {
  images: string[]
}

export function ListingImages({ images }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width)
            setCurrentIndex(index)
          }}
          scrollEventThrottle={16}
        >
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.image} />
          ))}
        </ScrollView>
        
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={false}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.fullImage} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  image: {
    width,
    height: height * 0.5,
  },
  counter: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width,
    height: '100%',
    resizeMode: 'contain',
  },
})