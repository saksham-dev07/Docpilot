import 'dart:developer';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:appwrite/appwrite.dart' as appwrite;
import 'pdf_generator.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyCAyE7spBm9azAJLUUI430DrVObQ0VbfC8",
      appId: "1:556288696163:web:8ca8974ca66388c3797d56",
      messagingSenderId: "556288696163",
      projectId: "gen-lang-client-0223003298",
      authDomain: "gen-lang-client-0223003298.firebaseapp.com",
      storageBucket: "gen-lang-client-0223003298.firebasestorage.app",
    ),
  );
  runApp(const DoctorVoiceApp());
}

class DoctorVoiceApp extends StatelessWidget {
  const DoctorVoiceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Doctor Companion App',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blueAccent),
      home: const AuthGate(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (snapshot.hasData) {
          return const AudioTranscriptionScreen();
        }
        return const LoginScreen();
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtl = TextEditingController();
  final _passCtl = TextEditingController();
  bool _isLoading = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailCtl.text.trim(),
        password: _passCtl.text.trim(),
      );
    } on FirebaseAuthException catch (e) {
      setState(() {
        _error = e.message;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted)
        setState(() {
          _isLoading = false;
        });
    }
  }

  @override
  void dispose() {
    _emailCtl.dispose();
    _passCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Doctor Login')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.medical_services,
              size: 80,
              color: Colors.blueAccent,
            ),
            const SizedBox(height: 32),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
            ],
            TextField(
              controller: _emailCtl,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passCtl,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            _isLoading
                ? const CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: _login,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      padding: const EdgeInsets.all(16),
                    ),
                    child: const Text('Login', style: TextStyle(fontSize: 18)),
                  ),
          ],
        ),
      ),
    );
  }
}

class AudioTranscriptionScreen extends StatefulWidget {
  const AudioTranscriptionScreen({super.key});
  @override
  State<AudioTranscriptionScreen> createState() =>
      _AudioTranscriptionScreenState();
}

class _AudioTranscriptionScreenState extends State<AudioTranscriptionScreen> {
  final AudioRecorder _audioRecorder = AudioRecorder();
  bool _isRecording = false;
  bool _isTranscribing = false;
  String _transcriptionResult = '';

  List<Map<String, String>> _patients = [];
  String? _selectedPatientId;
  String? _selectedPatientName;

  @override
  void initState() {
    super.initState();
    _fetchPatients();
  }

  Future<void> _fetchPatients() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final snapshot = await FirebaseFirestore.instanceFor(
        app: Firebase.app(),
        databaseId: 'ai-studio-f284b856-3b54-4fb3-8cc9-adca60383262',
      ).collection('appointments').where('doctorId', isEqualTo: user.uid).get();
      log(snapshot.docs.map((doc) => doc.data()).toList().toString());
      final Map<String, String> uniquePatients = {};
      for (var doc in snapshot.docs) {
        final data = doc.data();
        if (data['patientId'] != null && data['patientName'] != null) {
          uniquePatients[data['patientId']] = data['patientName'];
        }
      }
      setState(() {
        _patients = uniquePatients.entries
            .map((e) => {'id': e.key, 'name': e.value})
            .toList();

        log(
          'Fetched ${_patients.length} unique patients attached to doctor ${user.uid}',
        );
        log('Patients mapped: $_patients');
      });
    } catch (e) {
      log("Error fetching patients: $e");
    }
  }

  @override
  void dispose() {
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _toggleRecording() async {
    if (_selectedPatientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a patient first.')),
      );
      return;
    }

    if (_isRecording) {
      await _stopRecording();
    } else {
      await _startRecording();
    }
  }

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission is required.')),
        );
      }
      return;
    }

    if (await _audioRecorder.hasPermission()) {
      final Directory tempDir = await getTemporaryDirectory();
      final String path = '${tempDir.path}/doctor_note.wav';

      log('Starting recording. Target path: $path');

      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.wav),
        path: path,
      );

      setState(() {
        _isRecording = true;
        _transcriptionResult = '';
      });
    }
  }

  Future<void> _stopRecording() async {
    final String? path = await _audioRecorder.stop();
    log('Recording securely stopped. Path generated: $path');

    setState(() {
      _isRecording = false;
    });

    if (path != null) {
      await _transcribeAudio(path);
    }
  }

  Future<Map<String, dynamic>?> _callGemini(String transcript) async {
    log('Preparing to call Gemini streamGenerateContent API...');
    final apiKey = dotenv.env['GEMINI_API'];
    if (apiKey == null ||
        apiKey == "YOUR_GEMINI_API_KEY_HERE" ||
        apiKey.isEmpty) {
      throw Exception(
        "Invalid Gemini API Key in .env. Please fill GEMINI_API.",
      );
    }

    final model = 'gemini-3-flash-preview';
    final url =
        'https://generativelanguage.googleapis.com/v1beta/models/$model:streamGenerateContent?key=$apiKey';

    final dio = Dio();
    final response = await dio.post(
      url,
      data: {
        "contents": [
          {
            "role": "user",
            "parts": [
              {
                "text":
                    "Extract structured medical information from the following transcript:\n\n$transcript",
              },
            ],
          },
        ],
        "generationConfig": {
          "responseMimeType": "application/json",
          "responseSchema": {
            "type": "object",
            "properties": {
              "patientInformation": {
                "type": "object",
                "properties": {
                  "name": {"type": "string"},
                  "symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["name", "symptoms"],
                "propertyOrdering": ["name", "symptoms"],
              },
              "diagnosis": {
                "type": "object",
                "properties": {
                  "possibleDiagnoses": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["possibleDiagnoses"],
                "propertyOrdering": ["possibleDiagnoses"],
              },
              "tests": {
                "type": "object",
                "properties": {
                  "recommendedTests": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["recommendedTests"],
                "propertyOrdering": ["recommendedTests"],
              },
              "medications": {
                "type": "object",
                "properties": {
                  "prescribedMedications": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["prescribedMedications"],
                "propertyOrdering": ["prescribedMedications"],
              },
              "precautions": {
                "type": "object",
                "properties": {
                  "avoid": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                  "prophylactic": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["avoid", "prophylactic"],
                "propertyOrdering": ["avoid", "prophylactic"],
              },
              "followUp": {
                "type": "object",
                "properties": {
                  "nextSteps": {
                    "type": "array",
                    "items": {"type": "string"},
                  },
                },
                "required": ["nextSteps"],
                "propertyOrdering": ["nextSteps"],
              },
            },
            "required": [
              "patientInformation",
              "diagnosis",
              "tests",
              "medications",
              "precautions",
              "followUp",
            ],
            "propertyOrdering": [
              "patientInformation",
              "diagnosis",
              "tests",
              "medications",
              "precautions",
              "followUp",
            ],
          },
        },
      },
      options: Options(headers: {'Content-Type': 'application/json'}),
    );

    log('Gemini POST Response Status Code: ${response.statusCode}');

    if (response.statusCode == 200) {
      try {
        String fullText = "";
        for (var chunk in response.data) {
          if (chunk['candidates'] != null && chunk['candidates'].isNotEmpty) {
            var parts = chunk['candidates'][0]['content']['parts'];
            if (parts != null && parts.isNotEmpty) {
              fullText += parts[0]['text'] ?? "";
            }
          }
        }
        return jsonDecode(fullText);
      } catch (e) {
        log("Json Decode Error: $e");
        return null;
      }
    }
    return null;
  }

  Future<void> _transcribeAudio(String filePath) async {
    setState(() {
      _isTranscribing = true;
      _transcriptionResult = 'Uploading to Deepgram...';
    });

    try {
      final dio = Dio();
      final file = File(filePath);

      final length = await file.length();
      log('Initializing Deepgram API request. File length: $length bytes');

      final response = await dio.post(
        'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true',
        data: file.openRead(),
        options: Options(
          headers: {
            'Authorization': 'Token ${dotenv.env['DEEPGRAM_API_KEY']}',
            'Content-Type': 'audio/wav',
            Headers.contentLengthHeader: length,
          },
        ),
      );

      log('Deepgram POST Response Status Code: ${response.statusCode}');

      if (response.statusCode == 200) {
        final result = response.data;
        final transcript =
            result['results']['channels'][0]['alternatives'][0]['transcript'];

        log('Deepgram Raw Transcript Processed:\n$transcript');

        setState(() {
          _transcriptionResult = 'Structuring with Gemini AI...';
        });

        final geminiData = await _callGemini(transcript);
        if (geminiData != null) {
          setState(() {
            _transcriptionResult = 'Generating PDF Report...';
          });

          Map<String, dynamic> patientData = {};
          if (_selectedPatientId != null) {
            try {
              final docSnap = await FirebaseFirestore.instanceFor(
                app: Firebase.app(),
                databaseId: 'ai-studio-f284b856-3b54-4fb3-8cc9-adca60383262',
              ).collection('users').doc(_selectedPatientId).get();
              if (docSnap.exists) {
                patientData = docSnap.data() as Map<String, dynamic>;
              }
            } catch (e) {
              log("Failed to fetch patient data: $e");
            }
          }

          log('Invoking Syncfusion generator with patient details...');
          final pdfPath = await generateMedicalReportPdf(
            geminiData,
            patientData,
          );
          log('Syncfusion generation complete. Path saved at: $pdfPath');

          setState(() {
            _transcriptionResult = 'Uploading PDF to Appwrite Storage...';
          });

          // Appwrite Upload
          final client = appwrite.Client()
              .setEndpoint('https://fra.cloud.appwrite.io/v1')
              .setProject('69c180ea00142eafac4e');
          final storage = appwrite.Storage(client);

          final pdfFile = File(pdfPath);
          final fileSizeInBytes = await pdfFile.length();
          final fileSizeStr =
              '${(fileSizeInBytes / (1024 * 1024)).toStringAsFixed(2)} MB';
          final filename =
              'MedicalReport_${DateTime.now().millisecondsSinceEpoch}.pdf';

          final multipartFile = appwrite.InputFile.fromPath(
            path: pdfPath,
            filename: filename,
          );

          final uploadResponse = await storage.createFile(
            bucketId: '69c18187000ba824e0a1',
            fileId: appwrite.ID.unique(),
            file: multipartFile,
          );

          final fileId = uploadResponse.$id;
          log(
            'Appwrite File explicitly uploaded inside bucket `69c18187000ba824e0a1` with final FileId: $fileId',
          );
          final downloadUrl =
              'https://fra.cloud.appwrite.io/v1/storage/buckets/69c18187000ba824e0a1/files/$fileId/download?project=69c180ea00142eafac4e';
          final viewUrl =
              'https://fra.cloud.appwrite.io/v1/storage/buckets/69c18187000ba824e0a1/files/$fileId/view?project=69c180ea00142eafac4e';

          setState(() {
            _transcriptionResult = 'Saving record to Firestore...';
          });

          final user = FirebaseAuth.instance.currentUser!;
          final now = DateTime.now();
          final months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          final dateStr = '${months[now.month - 1]} ${now.day}, ${now.year}';

          final doctorName = user.displayName ?? 'Doctor';

          await FirebaseFirestore.instanceFor(
            app: Firebase.app(),
            databaseId: 'ai-studio-f284b856-3b54-4fb3-8cc9-adca60383262',
          ).collection('records').add({
            'appwriteDownloadUrl': downloadUrl,
            'appwriteFileId': fileId,
            'appwriteViewUrl': viewUrl,
            'category': 'Prescription',
            'createdAt': now.toUtc().toIso8601String(),
            'date': dateStr,
            'doctorId': user.uid,
            'doctorName': doctorName,
            'name': filename,
            'patientId': _selectedPatientId,
            'patientName': _selectedPatientName,
            'size': fileSizeStr,
            'status': 'Pending Review',
            'type': 'PDF',
          });

          log('Firestore `records` document correctly appended!');

          setState(() {
            _transcriptionResult =
                'Success!\n\nPDF uploaded to Appwrite & Firestore.\n\nAI Summary:\n${const JsonEncoder.withIndent('  ').convert(geminiData)}';
          });
        } else {
          setState(() {
            _transcriptionResult =
                'Gemini Structure Error.\n\nRaw Transcript: $transcript';
          });
        }
      } else {
        setState(() {
          _transcriptionResult =
              'Deepgram API Error: ${response.statusCode} - ${response.statusMessage}';
        });
      }
    } catch (e) {
      setState(() {
        _transcriptionResult = 'Process Failed: $e';
      });
    } finally {
      setState(() {
        _isTranscribing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Voice Notes'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => FirebaseAuth.instance.signOut(),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Patient Selector
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blueAccent.withOpacity(0.5)),
                  color: Colors.white,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    hint: const Text(
                      'Select Patient',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    value: _selectedPatientId,
                    isExpanded: true,
                    icon: const Icon(
                      Icons.arrow_drop_down,
                      color: Colors.blueAccent,
                    ),
                    items: _patients.map((p) {
                      return DropdownMenuItem<String>(
                        value: p['id'],
                        child: Text(
                          p['name'] ?? 'Unknown',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedPatientId = val;
                        _selectedPatientName = _patients.firstWhere(
                          (p) => p['id'] == val,
                        )['name'];
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.blue.withOpacity(0.2)),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      _transcriptionResult.isEmpty && !_isTranscribing
                          ? 'Select a patient and tap the microphone to start recording. The transcribed text will appear here.'
                          : _transcriptionResult,
                      style: const TextStyle(
                        fontSize: 16,
                        height: 1.5,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              if (_isTranscribing)
                const Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 20),
                    Text(
                      'Processing audio & saving to Cloud...',
                      style: TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  ],
                )
              else
                GestureDetector(
                  onTap: _toggleRecording,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      color: _isRecording
                          ? Colors.redAccent
                          : Colors.blueAccent,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color:
                              (_isRecording
                                      ? Colors.redAccent
                                      : Colors.blueAccent)
                                  .withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: Icon(
                      _isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                      color: Colors.white,
                      size: 45,
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Text(
                _isRecording ? 'Recording...' : 'Record',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: _isRecording ? Colors.redAccent : Colors.blueAccent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
