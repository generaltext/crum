// Sample content for the gallery "Try it live" demo, so it opens full instead of
// empty. Only ever runs in demo mode against a throwaway workspace (see store).

import type { Draft } from './events'
import { newId } from './ids'
import { mentionToken } from './mentions'

export async function seedDemo(dispatch: (d: Draft[]) => Promise<void>): Promise<void> {
  const acme = newId('org')
  const northwind = newId('org')
  const river = newId('org')
  const ada = newId('per')
  const grace = newId('per')
  const linus = newId('per')
  const opp1 = newId('opp')
  const opp2 = newId('opp')
  const deal1 = newId('deal')
  const deal2 = newId('deal')
  const note1 = newId('note')
  const note2 = newId('note')

  const drafts: Draft[] = [
    // Organizations
    { type: 'org.create', subject: acme, data: { name: 'Acme Labs', website: 'https://acme.example', location: 'Boston, MA', about: 'Applied research group; long-time collaborator.' } },
    { type: 'org.create', subject: northwind, data: { name: 'Northwind Co', website: 'https://northwind.example', location: 'Remote' } },
    { type: 'org.create', subject: river, data: { name: 'Riverstone Foundation', location: 'Austin, TX', about: 'Grant-funded; nonprofit pricing applies.' } },

    // People
    { type: 'person.create', subject: ada, data: { name: 'Ada Lovelace', role: 'Head of Research', email: 'ada@acme.example' } },
    { type: 'person.create', subject: grace, data: { name: 'Grace Hopper', role: 'CTO', email: 'grace@northwind.example' } },
    { type: 'person.create', subject: linus, data: { name: 'Linus Rivera', role: 'Program Director' } },

    // People ↔ organizations (many-to-many). Ada is affiliated with two.
    { type: 'link.add', subject: ada, data: { to: acme } },
    { type: 'link.add', subject: ada, data: { to: northwind } },
    { type: 'link.add', subject: grace, data: { to: northwind } },
    { type: 'link.add', subject: linus, data: { to: river } },

    // Opportunities
    { type: 'opp.create', subject: opp1, data: { title: 'What if we sold Sync to research labs?', description: `Labs like ${mentionToken(acme, 'Acme Labs')} want offline-first shared notebooks. ${mentionToken(ada, 'Ada')} is the champion.` } },
    { type: 'opp.create', subject: opp2, data: { title: 'Bundle CRUM for nonprofits', description: 'Discounted tier for orgs like ' + mentionToken(river, 'Riverstone Foundation') + '.' } },

    // Deals
    { type: 'deal.create', subject: deal1, data: { title: 'Acme — Team plan', value: 12000, org: acme, opp: opp1, stage: 'lead' } },
    { type: 'deal.stage_change', subject: deal1, data: { from: 'lead', to: 'proposal' } },
    { type: 'deal.create', subject: deal2, data: { title: 'Northwind pilot', value: 4000, org: northwind, stage: 'qualified' } },

    // Tags
    { type: 'tag.add', subject: ada, data: { label: 'priority' } },
    { type: 'tag.add', subject: acme, data: { label: 'research' } },
    { type: 'tag.add', subject: opp1, data: { label: 'research' } },
    { type: 'tag.add', subject: river, data: { label: 'nonprofit' } },
    { type: 'tag.add', subject: opp2, data: { label: 'nonprofit' } },

    // Notes + a comment thread
    { type: 'note.create', subject: note1, data: { target: ada, body: `Kickoff call with ${mentionToken(ada, 'Ada')} about ${mentionToken(opp1, 'the labs idea')}. Very interested; wants a pilot in Q3.` } },
    { type: 'comment.create', subject: newId('cmt'), data: { note: note1, body: 'Sent the pilot outline. Following up next week.' } },
    { type: 'note.create', subject: note2, data: { target: deal1, body: 'Proposal sent. Waiting on procurement sign-off.' } },
  ]

  await dispatch(drafts)
}
