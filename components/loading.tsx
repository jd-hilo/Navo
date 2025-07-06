import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}
    >
      <Animatable.Image
        source={require('../assets/images/darkIcon.png')}
        animation={'pulse'}
        easing="ease-out"
        iterationCount="infinite"
        duration={900}
        resizeMode="contain"
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}
