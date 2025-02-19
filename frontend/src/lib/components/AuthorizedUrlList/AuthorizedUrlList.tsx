import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { LemonTag } from 'lib/components/LemonTag/LemonTag'
import { LemonButton } from 'lib/components/LemonButton'
import {
    AuthorizedUrlListType as AuthorizedUrlListType,
    authorizedUrlListLogic,
    AuthorizedUrlListProps,
} from './authorizedUrlListLogic'
import { IconDelete, IconEdit, IconOpenInApp, IconPlus } from 'lib/components/icons'
import { Spinner } from 'lib/components/Spinner/Spinner'
import { Form } from 'kea-forms'
import { LemonInput } from 'lib/components/LemonInput/LemonInput'
import { Field } from 'lib/forms/Field'
import { LemonDialog } from '../LemonDialog'

function EmptyState({
    numberOfResults,
    isSearching,
    isAddingEntry,
    type,
}: {
    numberOfResults: number
    isSearching: boolean
    isAddingEntry: boolean
    type: AuthorizedUrlListType
}): JSX.Element | null {
    if (numberOfResults > 0) {
        return null
    }

    return isSearching || !isAddingEntry ? (
        <div className="border rounded p-4 text-muted-alt">
            {isSearching ? (
                <>
                    There are no authorized {type === AuthorizedUrlListType.RECORDING_DOMAINS ? 'domains' : 'URLs'} that
                    match your search.
                </>
            ) : (
                <>
                    {type === AuthorizedUrlListType.RECORDING_DOMAINS
                        ? 'No domains are specified, so recordings will be authorized on all domains.'
                        : 'There are no authorized urls. Add one to get started.'}
                </>
            )}
        </div>
    ) : null
}

function AuthorizedUrlForm({ actionId, type }: AuthorizedUrlListProps): JSX.Element {
    const logic = authorizedUrlListLogic({ actionId, type })
    const { isProposedUrlSubmitting } = useValues(logic)
    const { cancelProposingUrl } = useActions(logic)
    return (
        <Form
            logic={authorizedUrlListLogic}
            props={{ actionId, type }}
            formKey="proposedUrl"
            enableFormOnSubmit
            className="w-full space-y-2"
        >
            <Field name="url">
                <LemonInput
                    autoFocus
                    placeholder="Enter a URL or wildcard subdomain (e.g. https://*.posthog.com)"
                    data-attr="url-input"
                />
            </Field>
            <div className="flex justify-end gap-2">
                <LemonButton type="secondary" onClick={cancelProposingUrl}>
                    Cancel
                </LemonButton>
                <LemonButton htmlType="submit" type="primary" disabled={isProposedUrlSubmitting} data-attr="url-save">
                    Save
                </LemonButton>
            </div>
        </Form>
    )
}

export function AuthorizedUrlList({
    actionId,
    type,
    addText = 'Add',
}: AuthorizedUrlListProps & { addText?: string }): JSX.Element {
    const logic = authorizedUrlListLogic({ actionId, type })
    const {
        urlsKeyed,
        suggestionsLoading,
        searchTerm,
        launchUrl,
        editUrlIndex,
        isAddUrlFormVisible,
        onlyAllowDomains,
    } = useValues(logic)
    const { addUrl, removeUrl, setSearchTerm, newUrl, setEditUrlIndex } = useActions(logic)

    return (
        <div>
            <div className="flex items-center mb-4 gap-2 justify-between">
                <LemonInput
                    type="search"
                    placeholder={`Search for authorized ${onlyAllowDomains ? 'domains' : 'URLs'}`}
                    onChange={setSearchTerm}
                    value={searchTerm}
                />
                <LemonButton onClick={newUrl} type="secondary" icon={<IconPlus />} data-attr="toolbar-add-url">
                    {addText}
                </LemonButton>
            </div>
            {suggestionsLoading ? (
                <div className="border rounded p-4" key={-1}>
                    <Spinner className="text-xl" />
                </div>
            ) : (
                <div className="space-y-2">
                    {isAddUrlFormVisible && (
                        <div className="border rounded p-2">
                            <AuthorizedUrlForm type={type} actionId={actionId} />
                        </div>
                    )}
                    <EmptyState
                        numberOfResults={urlsKeyed.length}
                        isSearching={searchTerm.length > 0}
                        isAddingEntry={isAddUrlFormVisible}
                        type={type}
                    />
                    {urlsKeyed.map((keyedURL, index) => {
                        return editUrlIndex === index ? (
                            <div className="border rounded p-2">
                                <AuthorizedUrlForm type={type} actionId={actionId} />
                            </div>
                        ) : (
                            <div key={index} className={clsx('border rounded flex items-center p-2 pl-4')}>
                                {keyedURL.type === 'suggestion' && (
                                    <LemonTag type="highlight" className="mr-4 uppercase">
                                        Suggestion
                                    </LemonTag>
                                )}
                                <span title={keyedURL.url} className="flex-1 truncate">
                                    {keyedURL.url}
                                </span>
                                <div className="Actions flex space-x-2 shrink-0">
                                    {keyedURL.type === 'suggestion' ? (
                                        <LemonButton
                                            onClick={() => addUrl(keyedURL.url)}
                                            icon={<IconPlus />}
                                            data-attr="toolbar-apply-suggestion"
                                        >
                                            Apply suggestion
                                        </LemonButton>
                                    ) : (
                                        <>
                                            <LemonButton
                                                icon={<IconOpenInApp />}
                                                to={launchUrl(keyedURL.url)}
                                                targetBlank
                                                tooltip={
                                                    type === AuthorizedUrlListType.TOOLBAR_URLS
                                                        ? 'Launch toolbar'
                                                        : 'Launch url'
                                                }
                                                center
                                                className="ActionButton"
                                                data-attr="toolbar-open"
                                            >
                                                Launch
                                            </LemonButton>

                                            <LemonButton
                                                icon={<IconEdit />}
                                                onClick={() => setEditUrlIndex(keyedURL.originalIndex)}
                                                tooltip={'Edit'}
                                                center
                                                className="ActionButton"
                                            />

                                            <LemonButton
                                                icon={<IconDelete />}
                                                tooltip={`Remove ${onlyAllowDomains ? 'domain' : 'URL'}`}
                                                center
                                                className="ActionButton"
                                                onClick={() => {
                                                    LemonDialog.open({
                                                        title: <>Remove {keyedURL.url} ?</>,
                                                        description: `Are you want to remove this authorized ${
                                                            onlyAllowDomains ? 'domain' : 'URL'
                                                        }?`,
                                                        primaryButton: {
                                                            status: 'danger',
                                                            children: 'Remove',
                                                            onClick: () => removeUrl(index),
                                                        },
                                                        secondaryButton: {
                                                            children: 'Cancel',
                                                        },
                                                    })
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
