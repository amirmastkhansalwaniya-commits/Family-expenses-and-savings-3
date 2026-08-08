import React, { useState } from 'react';
import { Smartphone, Copy, Check, Code2, Database, Cpu, Layers } from 'lucide-react';

export const AndroidGuideView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'flutter' | 'kotlin' | 'firestore'>('flutter');

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const flutterCode = `// lib/main.dart
// Family Expense Tracker Android App in Flutter with Real-Time Firestore Sync
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const FamilyExpenseApp());
}

// Pre-defined 5 Family Members
const List<String> familyMembers = [
  'Amir Khan',
  'Angrej Singh',
  'Kajal',
  'Shahnaz',
  'Sonam'
];

const List<String> categories = [
  'Groceries', 'Utilities', 'Medical', 'Fuel', 
  'Rent', 'Dining', 'Education', 'Shopping', 'Others'
];

class FamilyExpenseApp extends StatelessWidget {
  const FamilyExpenseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Family Expense Tracker',
      theme: ThemeData(
        brightness: Brightness.light,
        primarySwatch: Colors.indigo,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String activeUser = familyMembers[0];
  final currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  void _openAddExpenseModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => AddExpenseSheet(activeUser: activeUser),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Family Expense Tracker (₹)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black80)),
        actions: [
          DropdownButton<String>(
            value: activeUser,
            dropdownColor: Colors.white,
            underline: const SizedBox(),
            items: familyMembers.map((m) => DropdownMenuItem(
              value: m, 
              child: Text(m, style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold))
            )).toList(),
            onChanged: (val) {
              if (val != null) setState(() => activeUser = val);
            },
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('expenses').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.indigo));
          }

          final docs = snapshot.data?.docs ?? [];
          double totalSpent = 0;
          Map<String, double> memberMap = {for (var m in familyMembers) m: 0};

          for (var doc in docs) {
            final data = doc.data() as Map<String, dynamic>;
            final amt = (data['amount'] as num?)?.toDouble() ?? 0;
            final paidBy = data['paidBy'] as String? ?? 'Amir Khan';
            totalSpent += amt;
            if (memberMap.containsKey(paidBy)) {
              memberMap[paidBy] = (memberMap[paidBy] ?? 0) + amt;
            }
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Total Summary Card
                Card(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Monthly Family Expense', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 6),
                        Text(currencyFormat.format(totalSpent), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.indigo)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Breakdown by Member', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black80)),
                const SizedBox(height: 8),

                // Pre-configured member cards
                ...familyMembers.map((m) => Card(
                  color: Colors.white,
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.indigoAccent,
                      child: Text(m[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                    title: Text(m, style: const TextStyle(color: Colors.black80, fontWeight: FontWeight.bold)),
                    trailing: Text(currencyFormat.format(memberMap[m] ?? 0), style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                )),

                const SizedBox(height: 16),
                const Text('Recent Real-Time Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black80)),
                const SizedBox(height: 8),

                // Transactions List
                ...docs.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  return Card(
                    color: Colors.white,
                    child: ListTile(
                      title: Text(data['category'] ?? 'Expense', style: const TextStyle(color: Colors.black80, fontWeight: FontWeight.bold)),
                      subtitle: Text("Paid by \${data['paidBy']} • \${data['date']}", style: const TextStyle(color: Colors.grey)),
                      trailing: Text(currencyFormat.format(data['amount'] ?? 0), style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
                    ),
                  );
                }),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.indigo,
        onPressed: () => _openAddExpenseModal(context),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Expense (₹)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class AddExpenseSheet extends StatefulWidget {
  final String activeUser;
  const AddExpenseSheet({super.key, required this.activeUser});

  @override
  State<AddExpenseSheet> createState() => _AddExpenseSheetState();
}

class _AddExpenseSheetState extends State<AddExpenseSheet> {
  final _amountController = TextEditingController();
  final _notesController = TextEditingController();
  late String _selectedMember;
  String _selectedCategory = categories[0];

  @override
  void initState() {
    super.initState();
    _selectedMember = widget.activeUser;
  }

  void _saveExpense() async {
    final amt = double.tryParse(_amountController.text);
    if (amt == null || amt <= 0) return;

    await FirebaseFirestore.instance.collection('expenses').add({
      'amount': amt,
      'category': _selectedCategory,
      'paidBy': _selectedMember,
      'date': DateTime.now().toIso8601String().split('T')[0],
      'notes': _notesController.text.trim(),
      'createdAt': FieldValue.serverTimestamp(),
    });

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20, right: 20, top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Log New Family Expense (₹)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black80)),
          const SizedBox(height: 16),
          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.indigo, fontSize: 24, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(
              prefixText: '₹ ',
              labelText: 'Amount in INR (₹)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedMember,
            items: familyMembers.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
            onChanged: (val) => setState(() => _selectedMember = val!),
            decoration: const InputDecoration(labelText: 'Paid By', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (val) => setState(() => _selectedCategory = val!),
            decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            style: const TextStyle(color: Colors.black80),
            decoration: const InputDecoration(labelText: 'Notes (Optional)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              minimumSize: const Size.fromHeight(50),
            ),
            onPressed: _saveExpense,
            child: const Text('Save Expense', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
`;

  const kotlinCode = `// MainActivity.kt - Android Kotlin Jetpack Compose Code
package com.family.expensetracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class Expense(
    val id: String = "",
    val amount: Double = 0.0,
    val category: String = "",
    val paidBy: String = "",
    val date: String = "",
    val notes: String = ""
)

val FAMILY_MEMBERS = listOf("Amir Khan", "Angrej Singh", "Kajal", "Shahnaz", "Sonam")

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme()) {
                FamilyExpenseAppScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamilyExpenseAppScreen() {
    val db = FirebaseFirestore.getInstance()
    var selectedMember by remember { mutableStateOf(FAMILY_MEMBERS[0]) }
    val expensesState by getExpensesFlow(db).collectAsState(initial = emptyList())

    val totalSpent = expensesState.sumOf { it.amount }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Family Expense Tracker (₹)", fontWeight = FontWeight.Bold) },
                actions = {
                    Text("User: ", fontSize = 12.sp, color = Color.Gray)
                    Text(selectedMember, color = Color(0xFF4F46E5), fontWeight = FontWeight.Bold)
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Summary Card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Total Family Expenses in INR", color = Color.Gray, fontSize = 12.sp)
                    Text("₹ %.2f".format(totalSpent), fontSize = 32.sp, fontWeight = FontWeight.Bold, color = Color(0xFF4F46E5))
                }
            }

            Text("Real-Time Transactions", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn {
                items(expensesState) { expense ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(expense.category, fontWeight = FontWeight.Bold, color = Color.Black)
                                Text("Paid by \${expense.paidBy} • \${expense.date}", color = Color.Gray, fontSize = 12.sp)
                            }
                            Text("₹ %.2f".format(expense.amount), color = Color(0xFF4F46E5), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

fun getExpensesFlow(db: FirebaseFirestore): Flow<List<Expense>> = callbackFlow {
    val listener = db.collection("expenses")
        .addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener
            val list = snapshot?.documents?.mapNotNull { doc ->
                doc.toObject(Expense::class.java)?.copy(id = doc.id)
            } ?: emptyList()
            trySend(list)
        }
    awaitClose { listener.remove() }
}
`;

  const firestoreRulesCode = `// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if true;
    }
    match /budgets/{budgetId} {
      allow read, write: if true;
    }
  }
}
`;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 text-slate-900 shadow-xs">
        <div className="flex items-center space-x-3.5 mb-2">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">Android App Technical Implementation Guide</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Complete, production-ready Flutter and Kotlin code targeting Android multi-device real-time syncing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono font-bold">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-slate-800">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Exact 5 Family Profiles</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-slate-800">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Multi-Device Real-Time Firestore</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-slate-800">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Strict INR (₹) Currency</span>
          </div>
        </div>
      </div>

      {/* Code Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveCodeTab('flutter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCodeTab === 'flutter'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Flutter (main.dart)</span>
        </button>

        <button
          onClick={() => setActiveCodeTab('kotlin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCodeTab === 'kotlin'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Kotlin / Compose (MainActivity.kt)</span>
        </button>

        <button
          onClick={() => setActiveCodeTab('firestore')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeCodeTab === 'firestore'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Firestore Rules & Schema</span>
        </button>
      </div>

      {/* Active Code Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs">
          <span className="font-mono text-indigo-300 font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            {activeCodeTab === 'flutter' && 'lib/main.dart — Complete Flutter Android Source Code'}
            {activeCodeTab === 'kotlin' && 'app/src/main/java/MainActivity.kt — Android Jetpack Compose Code'}
            {activeCodeTab === 'firestore' && 'firestore.rules — Firestore Security & Real-Time Setup'}
          </span>

          <button
            onClick={() => {
              const code = activeCodeTab === 'flutter' ? flutterCode : activeCodeTab === 'kotlin' ? kotlinCode : firestoreRulesCode;
              copyToClipboard(code, activeCodeTab);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            {copiedSection === activeCodeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Source Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
          <code>
            {activeCodeTab === 'flutter' && flutterCode}
            {activeCodeTab === 'kotlin' && kotlinCode}
            {activeCodeTab === 'firestore' && firestoreRulesCode}
          </code>
        </pre>
      </div>

    </div>
  );
};
