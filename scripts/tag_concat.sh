set -e

function tag_concat() {
  # Check if there are any arguments
  if [[ $# -eq 0 ]]; then
    echo "Usage: tag_concat --key1 value1 --key2 value2 ..." >&2
    return 1
  fi

  while [[ $# -gt 0 ]]; do
    # Ensure the argument starts with --
    if [[ "$1" != --* ]]; then
      echo "Error: Invalid argument format. Expected '--key' but got '$1'." >&2
      return 1
    fi

    # Extract tag name (remove leading --)
    local tag_name="${1#--}"

    # Check if there's a value provided for the tag
    if [[ -z "$2" || "$2" == --* ]]; then
      echo "Error: Missing value for argument '$1'." >&2
      return 1
    fi

    local tag_value="$2"

    # Print the tag and value
    echo "<${tag_name}>"
    echo "${tag_value}"
    echo "</${tag_name}>"

    # Move to the next pair of arguments
    shift 2
  done
}

tag_concat "$@"
