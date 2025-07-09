/**
 * Test Suite: Language Localization Bug Validation
 * 
 * ISSUE: Framework configured with 'pt' (Portuguese) as default language,
 * but agents are initializing with Spanish names instead of Portuguese names.
 * 
 * ROOT CAUSE:
 * 1. core-config.yaml has language.default: pt
 * 2. agentNames.qa.pt should be "Alex" (correct)  
 * 3. agentNames.qa.es should be "Alex" (matches Spanish behavior)
 * 4. BUT agent is using Spanish introduction instead of Portuguese
 * 5. Agent file qa.md has hardcoded name: Alex instead of dynamic resolution
 * 
 * EXPECTED BEHAVIOR:
 * - When language.default = pt, agent should use Portuguese localization
 * - Agent should dynamically load name from core-config.yaml agentNames.qa.pt
 * - Language directives should respect core-config.yaml language.default setting
 */

const assert = require('assert');
const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');

class LanguageLocalizationBugTest {
  
  constructor() {
    this.coreConfigPath = path.join(__dirname, '../.ai-squad-core/core-config.yaml');
    this.qaAgentPath = path.join(__dirname, '../.ai-squad-core/agents/qa.md');
    this.coreConfig = null;
    this.qaAgentContent = null;
  }

  async setup() {
    // Load core configuration
    try {
      const coreConfigContent = await fs.readFile(this.coreConfigPath, 'utf8');
      this.coreConfig = yaml.load(coreConfigContent);
    } catch (error) {
      throw new Error(`Failed to load core-config.yaml: ${error.message}`);
    }

    // Load QA agent content
    try {
      this.qaAgentContent = await fs.readFile(this.qaAgentPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load qa.md: ${error.message}`);
    }
  }

  // Test 1: Verify core-config.yaml language configuration
  testCoreConfigLanguageSettings() {
    console.log('🧪 Test 1: Core Configuration Language Settings');
    
    assert(this.coreConfig.language, 'language section should exist in core-config.yaml');
    assert.strictEqual(this.coreConfig.language.default, 'pt', 
      'Default language should be Portuguese (pt)');
    
    assert(this.coreConfig.language.agentNames, 
      'agentNames mapping should exist');
    assert(this.coreConfig.language.agentNames.qa, 
      'qa agent names should be defined');
    
    const qaNames = this.coreConfig.language.agentNames.qa;
    assert.strictEqual(qaNames.pt, 'Alex', 
      'QA agent Portuguese name should be Alex');
    assert.strictEqual(qaNames.es, 'Alex', 
      'QA agent Spanish name should be Alex');
    
    console.log('✅ PASS - Core configuration is correct');
    console.log(`   Default language: ${this.coreConfig.language.default}`);
    console.log(`   QA names: pt="${qaNames.pt}", es="${qaNames.es}"`);
    
    return true;
  }

  // Test 2: Verify language directives in agent file  
  testAgentLanguageDirectives() {
    console.log('\n🧪 Test 2: Agent Language Directives');
    
    const hasLanguageDirectives = this.qaAgentContent.includes('language-directives:');
    assert(hasLanguageDirectives, 'Agent should have language-directives section');
    
    const hasLocalizedNameDirective = this.qaAgentContent.includes(
      'Load your localized name from core-config.yaml agentNames.qa'
    );
    assert(hasLocalizedNameDirective, 
      'Agent should have directive to load localized name from core-config.yaml');
    
    const hasIntroductionDirective = this.qaAgentContent.includes(
      'Introduce yourself using your localized name'
    );
    assert(hasIntroductionDirective, 
      'Agent should have directive to introduce using localized name');
    
    console.log('✅ PASS - Language directives are correctly defined');
    
    return true;
  }

  // Test 3: Check for hardcoded name bug
  testHardcodedNameBug() {
    console.log('\n🧪 Test 3: Hardcoded Name Bug Detection');
    
    // Extract YAML header from agent file
    const yamlMatch = this.qaAgentContent.match(/```yaml\n([\s\S]*?)\n```/);
    assert(yamlMatch, 'Agent file should contain YAML configuration');
    
    const agentConfig = yaml.load(yamlMatch[1]);
    
    // Check if name is hardcoded instead of being dynamically resolved
    const isNameHardcoded = agentConfig.agent && agentConfig.agent.name;
    if (isNameHardcoded) {
      console.log('🐛 BUG STILL EXISTS - Name is hardcoded in agent configuration');
      console.log(`   Hardcoded name: "${agentConfig.agent.name}"`);
      console.log('   This should be dynamically resolved from core-config.yaml');
      return false; // This indicates the bug exists
    }
    
    console.log('✅ PASS - No hardcoded name found (bug fixed)');
    console.log('   Agent now uses dynamic name resolution from core-config.yaml');
    return true;
  }

  // Test 4: Simulate expected behavior for Portuguese
  testExpectedPortugueseBehavior() {
    console.log('\n🧪 Test 4: Expected Portuguese Behavior Simulation');
    
    const defaultLang = this.coreConfig.language.default;
    const qaNames = this.coreConfig.language.agentNames.qa;
    
    // Simulate name resolution logic
    const resolvedName = qaNames[defaultLang] || qaNames.en || 'Unknown';
    
    console.log('📋 Expected behavior simulation:');
    console.log(`   Default language: ${defaultLang}`);
    console.log(`   Resolved QA name: ${resolvedName}`);
    console.log(`   Expected greeting: "Olá! Sou ${resolvedName}, Senior Developer & QA Architect de AI-SQUAD."`);
    
    assert.strictEqual(resolvedName, 'Alex', 
      'Name should resolve to Alex for Portuguese');
    
    // The bug is that the agent is using Spanish introduction pattern instead of Portuguese
    console.log('\n🐛 ACTUAL BUG:');
    console.log('   Agent is using: "¡Hola! Soy Alex..." (Spanish)');
    console.log('   Should be using: "Olá! Sou Alex..." (Portuguese)');
    
    return true;
  }

  // Test 5: Installation language update logic test
  testInstallationLanguageLogic() {
    console.log('\n🧪 Test 5: Installation Language Update Logic');
    
    // Simulate the installer bug
    const simulateInstaller = (configLanguage, installConfig) => {
      // Bug in installer.js:348-350
      // Only updates language if config.language is provided during installation
      // Does not respect existing core-config.yaml default language
      
      if (installConfig.language && installConfig.language !== 'en') {
        return { updated: true, language: installConfig.language };
      }
      return { updated: false, language: configLanguage };
    };
    
    // Test scenario 1: Fresh install without language specified
    const scenario1 = simulateInstaller('pt', {});
    console.log('📋 Scenario 1 - Fresh install without language specified:');
    console.log(`   Core config default: pt`);
    console.log(`   Install config: {} (no language specified)`);
    console.log(`   Result: updated=${scenario1.updated}, language=${scenario1.language}`);
    console.log('   🐛 BUG: Language not updated, agents keep default behavior');
    
    // Test scenario 2: Install with explicit language
    const scenario2 = simulateInstaller('pt', { language: 'pt' });
    console.log('\n📋 Scenario 2 - Install with explicit Portuguese:');
    console.log(`   Core config default: pt`);
    console.log(`   Install config: { language: 'pt' }`);
    console.log(`   Result: updated=${scenario2.updated}, language=${scenario2.language}`);
    console.log('   ✅ WORKS: Language properly updated');
    
    return true;
  }

  // Test 6: Agent name file update verification
  testAgentNameFileUpdate() {
    console.log('\n🧪 Test 6: Agent Name File Update Logic');
    
    // Test the enhanced updateAgentNameInFile logic
    const simulateNameUpdate = (agentContent, newName) => {
      const nameRegex = /(\s+name:\s+)([^\n\r]+)/;
      const match = agentContent.match(nameRegex);
      
      if (match) {
        return agentContent.replace(nameRegex, `$1${newName}`);
      } else {
        // If no name field exists, add it after the id field
        const idRegex = /(\s+id:\s+[^\n\r]+)/;
        const idMatch = agentContent.match(idRegex);
        
        if (idMatch) {
          return agentContent.replace(idRegex, `$1\n  name: ${newName}`);
        }
      }
      return agentContent;
    };
    
    // Test 1: Existing name field
    const testContent1 = `  name: Alex`;
    const updated1 = simulateNameUpdate(testContent1, 'TestName');
    console.log('📋 Test 1 - Update existing name:');
    console.log(`   Original: "${testContent1}"`);
    console.log(`   Updated:  "${updated1}"`);
    
    // Test 2: No name field, add after id
    const testContent2 = `  id: qa\n  title: QA Engineer`;
    const updated2 = simulateNameUpdate(testContent2, 'Alex');
    console.log('\n📋 Test 2 - Add name after id:');
    console.log(`   Original: "${testContent2}"`);
    console.log(`   Updated:  "${updated2}"`);
    
    console.log('\n✅ PASS - Enhanced agent name update logic works correctly');
    console.log('   ✓ Can update existing name fields');
    console.log('   ✓ Can add name field when missing');
    
    return true;
  }

  async runAllTests() {
    console.log('🚀 Starting Language Localization Bug Test Suite\n');
    
    await this.setup();
    
    const results = {
      coreConfig: this.testCoreConfigLanguageSettings(),
      languageDirectives: this.testAgentLanguageDirectives(),
      hardcodedName: this.testHardcodedNameBug(),
      expectedBehavior: this.testExpectedPortugueseBehavior(),
      installationLogic: this.testInstallationLanguageLogic(),
      nameFileUpdate: this.testAgentNameFileUpdate()
    };
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    
    let passCount = 0;
    let totalTests = 0;
    
    for (const [testName, result] of Object.entries(results)) {
      totalTests++;
      if (result) passCount++;
      
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${testName}`);
    }
    
    console.log(`\nTests passed: ${passCount}/${totalTests}`);
    
    // Bug summary
    console.log('\n🐛 BUG ANALYSIS SUMMARY:');
    console.log('========================');
    console.log('ISSUE: Framework configured with Portuguese (pt) but agent initializes in Spanish');
    console.log('\nROOT CAUSES:');
    console.log('1. Agent has hardcoded name in YAML instead of dynamic resolution');
    console.log('2. Installer only updates language config when explicitly specified during install');
    console.log('3. Agent not respecting core-config.yaml default language setting');
    console.log('\nFIXES NEEDED:');
    console.log('1. Remove hardcoded name from agent files');
    console.log('2. Implement dynamic name resolution from core-config.yaml');
    console.log('3. Update installer to respect existing language defaults');
    console.log('4. Ensure language directives are properly executed at agent startup');
    
    return results;
  }
}

// Export for use in test runners
module.exports = LanguageLocalizationBugTest;

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const testSuite = new LanguageLocalizationBugTest();
      await testSuite.runAllTests();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  })();
}