import 'dart:async';
import 'dart:math';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../models/models.dart';

typedef LiveScoreHandler = void Function(LiveScoreUpdate update);
typedef LiveOddsHandler = void Function(LiveOddsUpdate update);
typedef SignalApprovedHandler = void Function(SignalApprovedEvent event);
typedef SocketConnectionHandler = void Function(bool connected);

class SocketService {
  io.Socket? _socket;
  Timer? _reconnectTimer;
  String? _role;
  int _reconnectAttempts = 0;
  static const _maxReconnectDelaySec = 30;

  final LiveScoreHandler? onLiveScore;
  final LiveOddsHandler? onLiveOdds;
  final SignalApprovedHandler? onSignalApproved;
  final SocketConnectionHandler? onConnectionChange;

  SocketService({
    this.onLiveScore,
    this.onLiveOdds,
    this.onSignalApproved,
    this.onConnectionChange,
  });

  bool get isConnected => _socket?.connected ?? false;

  void connect({required String role}) {
    _role = role;
    _reconnectAttempts = 0;
    _connectInternal();
  }

  void _connectInternal() {
    _cancelReconnectTimer();
    _socket?.dispose();

    _socket = io.io(
      AppConfig.wsBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'role': _role})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(999)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(10000)
          .build(),
    );

    _socket!.onConnect((_) {
      _reconnectAttempts = 0;
      onConnectionChange?.call(true);
    });

    _socket!.onDisconnect((_) {
      onConnectionChange?.call(false);
      _scheduleReconnect();
    });

    _socket!.onConnectError((_) {
      onConnectionChange?.call(false);
      _scheduleReconnect();
    });

    _socket!.on('live:score', (data) {
      if (data is Map && onLiveScore != null) {
        onLiveScore!(LiveScoreUpdate.fromJson(Map<String, dynamic>.from(data)));
      }
    });

    _socket!.on('live:odds', (data) {
      if (data is Map && onLiveOdds != null) {
        onLiveOdds!(LiveOddsUpdate.fromJson(Map<String, dynamic>.from(data)));
      }
    });

    _socket!.on('signal:approved', (data) {
      if (data is Map && onSignalApproved != null) {
        onSignalApproved!(SignalApprovedEvent.fromJson(Map<String, dynamic>.from(data)));
      }
    });
  }

  void _scheduleReconnect() {
    if (_role == null) return;
    _cancelReconnectTimer();
    _reconnectAttempts++;
    final delaySec = min(_reconnectAttempts * 2, _maxReconnectDelaySec);
    _reconnectTimer = Timer(Duration(seconds: delaySec), _connectInternal);
  }

  void _cancelReconnectTimer() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  void joinMatch(int matchId) {
    _socket?.emit('join:match', {'matchId': matchId});
  }

  void leaveMatch(int matchId) {
    _socket?.emit('leave:match', {'matchId': matchId});
  }

  void disconnect() {
    _role = null;
    _cancelReconnectTimer();
    _socket?.dispose();
    _socket = null;
    onConnectionChange?.call(false);
  }
}
