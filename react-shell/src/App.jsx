import { Component } from 'react';
import css from './styles.js';
import LoginScreen from './LoginScreen.jsx';
import RosterPanel from './RosterPanel.jsx';

// If anything in the React layer throws, step aside: removing "rx-ready" brings the
// original login overlay back, and RosterPanel's cleanup restores the original Roster modal.
class Safety extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) {
    console.error('[ECR React shell] falling back to the original UI:', err);
    document.documentElement.classList.remove('rx-ready');
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function App() {
  return (
    <Safety>
      <style>{css}</style>
      <LoginScreen />
      <RosterPanel />
    </Safety>
  );
}
